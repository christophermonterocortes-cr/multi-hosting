import net from 'net';
import { db } from '../config/database';
import { config } from '../config/env';
import { DockerService } from './docker.service';

export interface PortInfo {
  port: number;
  status: 'FREE' | 'ALLOCATED' | 'RESERVED' | 'OCCUPIED_HOST' | 'CONFLICT';
  projectId: string | null;
  projectName?: string;
  allocatedAt: string | null;
  releasedAt: string | null;
}

// In-process mutex for serializing port allocation requests
let allocationLock = Promise.resolve();

export class PortService {
  /**
   * Probe host IP addresses to see if a port is actively listening on the host network
   */
  private static async probeHostTcp(port: number): Promise<boolean> {
    const targets = [config.serverIp, '127.0.0.1', '172.17.0.1'].filter(Boolean);
    const uniqueTargets = [...new Set(targets)];

    for (const host of uniqueTargets) {
      try {
        const isOccupied = await new Promise<boolean>((resolve) => {
          const socket = new net.Socket();
          socket.setTimeout(250);

          socket.once('connect', () => {
            socket.destroy();
            resolve(true); // Actively listening on host
          });

          socket.once('timeout', () => {
            socket.destroy();
            resolve(false);
          });

          socket.once('error', () => {
            socket.destroy();
            resolve(false);
          });

          socket.connect(port, host);
        });

        if (isOccupied) return true;
      } catch {
        // continue
      }
    }
    return false;
  }

  /**
   * Test if a specific TCP port is open/bindable on 0.0.0.0 on the host
   */
  public static async isPortAvailableOnHost(port: number, knownDockerPorts?: Set<number>): Promise<boolean> {
    if (knownDockerPorts && knownDockerPorts.has(port)) {
      return false;
    }

    const hostListening = await this.probeHostTcp(port);
    if (hostListening) {
      return false;
    }

    return new Promise((resolve) => {
      const server = net.createServer();
      
      server.once('error', () => {
        resolve(false);
      });

      server.once('listening', () => {
        server.close(() => {
          resolve(true);
        });
      });

      try {
        server.listen(port, '0.0.0.0');
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Mark a port as reserved/occupied by host process
   */
  public static markPortOccupied(port: number): void {
    try {
      const existing = db.prepare('SELECT port FROM assigned_ports WHERE port = ?').get(port) as any;
      if (existing) {
        db.prepare("UPDATE assigned_ports SET status = 'RESERVED', allocated_at = datetime('now') WHERE port = ?")
          .run(port);
      } else {
        db.prepare("INSERT INTO assigned_ports (port, status, allocated_at) VALUES (?, 'RESERVED', datetime('now'))")
          .run(port);
      }
    } catch (err: any) {
      console.warn(`Failed to mark port ${port} as occupied:`, err.message);
    }
  }

  /**
   * Atomically allocate the next available port >= 16000
   */
  public static async allocatePort(projectId: string): Promise<number> {
    const previousLock = allocationLock;
    let releaseLock: () => void;
    allocationLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    try {
      await previousLock;

      const startPort = parseInt(
        (db.prepare("SELECT value FROM system_settings WHERE key = 'port_range_start'").get() as any)?.value || config.portRangeStart.toString(),
        10
      );
      const endPort = parseInt(
        (db.prepare("SELECT value FROM system_settings WHERE key = 'port_range_end'").get() as any)?.value || config.portRangeEnd.toString(),
        10
      );

      // Query Docker daemon for all currently published host ports
      const dockerPorts = await DockerService.getAllPublishedHostPorts();

      // Fetch all currently allocated or reserved ports from DB
      const allocatedPorts = new Set<number>(
        (db.prepare("SELECT port FROM assigned_ports WHERE status IN ('ALLOCATED', 'RESERVED')").all() as any[])
          .map(r => r.port)
      );

      let chosenPort: number | null = null;

      for (let p = startPort; p <= endPort; p++) {
        if (allocatedPorts.has(p)) {
          continue;
        }

        if (dockerPorts.has(p)) {
          this.markPortOccupied(p);
          console.warn(`⚠️ Port ${p} is in use by Docker container on host. Marked as RESERVED.`);
          continue;
        }

        const isFreeOnHost = await this.isPortAvailableOnHost(p, dockerPorts);
        if (isFreeOnHost) {
          chosenPort = p;
          break;
        } else {
          this.markPortOccupied(p);
          console.warn(`⚠️ Port ${p} is in use on host network. Marked as RESERVED.`);
        }
      }

      if (!chosenPort) {
        throw new Error(`Port allocation failed: Exhausted all available ports in range ${startPort}-${endPort}`);
      }

      const allocateTx = db.transaction(() => {
        const existing = db.prepare('SELECT port FROM assigned_ports WHERE port = ?').get(chosenPort) as any;
        if (existing) {
          db.prepare("UPDATE assigned_ports SET project_id = ?, status = 'ALLOCATED', allocated_at = datetime('now'), released_at = NULL WHERE port = ?")
            .run(projectId, chosenPort);
        } else {
          db.prepare("INSERT INTO assigned_ports (port, project_id, status, allocated_at) VALUES (?, ?, 'ALLOCATED', datetime('now'))")
            .run(chosenPort, projectId);
        }

        db.prepare("UPDATE projects SET port = ?, updated_at = datetime('now') WHERE id = ?")
          .run(chosenPort, projectId);
      });

      allocateTx();

      return chosenPort;
    } finally {
      releaseLock!();
    }
  }

  /**
   * Safely release an assigned port when a project is deleted or updated
   */
  public static async releasePort(port: number, projectId?: string): Promise<void> {
    const releaseTx = db.transaction(() => {
      if (projectId) {
        db.prepare("UPDATE assigned_ports SET status = 'RELEASED', released_at = datetime('now') WHERE port = ? AND project_id = ?")
          .run(port, projectId);
        db.prepare("UPDATE projects SET port = NULL WHERE port = ? AND id = ?")
          .run(port, projectId);
      } else {
        db.prepare("UPDATE assigned_ports SET status = 'RELEASED', released_at = datetime('now') WHERE port = ?")
          .run(port);
        db.prepare("UPDATE projects SET port = NULL WHERE port = ?")
          .run(port);
      }
    });

    releaseTx();
  }

  /**
   * Get complete status grid of all ports in the allowed range
   */
  public static async getPortMatrix(limit = 100): Promise<{
    startPort: number;
    endPort: number;
    total: number;
    allocatedCount: number;
    freeCount: number;
    ports: PortInfo[];
  }> {
    const startPort = parseInt(
      (db.prepare("SELECT value FROM system_settings WHERE key = 'port_range_start'").get() as any)?.value || config.portRangeStart.toString(),
      10
    );
    const endPort = parseInt(
      (db.prepare("SELECT value FROM system_settings WHERE key = 'port_range_end'").get() as any)?.value || config.portRangeEnd.toString(),
      10
    );

    const dbAllocations = db.prepare(`
      SELECT ap.port, ap.status, ap.project_id, ap.allocated_at, ap.released_at, p.name as project_name
      FROM assigned_ports ap
      LEFT JOIN projects p ON ap.project_id = p.id
    `).all() as any[];

    const allocationMap = new Map<number, any>();
    for (const alloc of dbAllocations) {
      allocationMap.set(alloc.port, alloc);
    }

    const portList: PortInfo[] = [];
    const maxScan = Math.min(startPort + limit, endPort + 1);
    let allocatedCount = 0;
    let freeCount = 0;

    for (let p = startPort; p < maxScan; p++) {
      const dbEntry = allocationMap.get(p);
      if (dbEntry && dbEntry.status === 'ALLOCATED') {
        allocatedCount++;
        portList.push({
          port: p,
          status: 'ALLOCATED',
          projectId: dbEntry.project_id,
          projectName: dbEntry.project_name,
          allocatedAt: dbEntry.allocated_at,
          releasedAt: null
        });
      } else if (dbEntry && dbEntry.status === 'RESERVED') {
        portList.push({
          port: p,
          status: 'RESERVED',
          projectId: dbEntry.project_id,
          projectName: dbEntry.project_name,
          allocatedAt: dbEntry.allocated_at,
          releasedAt: null
        });
      } else {
        freeCount++;
        portList.push({
          port: p,
          status: 'FREE',
          projectId: null,
          allocatedAt: null,
          releasedAt: dbEntry ? dbEntry.released_at : null
        });
      }
    }

    return {
      startPort,
      endPort,
      total: endPort - startPort + 1,
      allocatedCount,
      freeCount,
      ports: portList
    };
  }

  /**
   * Health reconciliation scanner
   */
  public static async reconcilePorts(): Promise<{ conflictsFound: number; message: string }> {
    const allocated = db.prepare(`
      SELECT ap.port, ap.project_id, p.id as project_exists, p.status as project_status
      FROM assigned_ports ap
      LEFT JOIN projects p ON ap.project_id = p.id
      WHERE ap.status = 'ALLOCATED'
    `).all() as any[];

    let conflicts = 0;
    for (const entry of allocated) {
      if (!entry.project_exists || entry.project_status === 'DELETED') {
        db.prepare("UPDATE assigned_ports SET status = 'RELEASED', released_at = datetime('now') WHERE port = ?")
          .run(entry.port);
        conflicts++;
      }
    }

    // Also sync all external Docker ports into assigned_ports as RESERVED
    try {
      const dockerPorts = await DockerService.getAllPublishedHostPorts();
      const startPort = parseInt(
        (db.prepare("SELECT value FROM system_settings WHERE key = 'port_range_start'").get() as any)?.value || config.portRangeStart.toString(),
        10
      );
      const endPort = parseInt(
        (db.prepare("SELECT value FROM system_settings WHERE key = 'port_range_end'").get() as any)?.value || config.portRangeEnd.toString(),
        10
      );

      const activeProjectPorts = new Set<number>(
        (db.prepare("SELECT port FROM projects WHERE status != 'DELETED' AND port IS NOT NULL").all() as any[])
          .map(r => r.port)
      );

      for (const p of dockerPorts) {
        if (p >= startPort && p <= endPort && !activeProjectPorts.has(p)) {
          this.markPortOccupied(p);
          conflicts++;
        }
      }
    } catch {
      // Non-blocking
    }

    return {
      conflictsFound: conflicts,
      message: `Reconciliation complete. Handled ${conflicts} port status adjustments.`
    };
  }
}
