import si from 'systeminformation';
import { db } from '../config/database';
import { DockerService } from './docker.service';

export interface SystemHealthMetrics {
  cpu: {
    loadPercent: number;
    cores: number;
    model: string;
  };
  memory: {
    totalMb: number;
    usedMb: number;
    freeMb: number;
    usagePercent: number;
  };
  disk: {
    totalGb: number;
    usedGb: number;
    freeGb: number;
    usagePercent: number;
  };
  docker: {
    available: boolean;
    version?: string;
    error?: string;
  };
  controlPlaneDb: {
    connected: boolean;
    totalProjects: number;
    totalUsers: number;
    allocatedPorts: number;
  };
  uptimeSeconds: number;
  timestamp: string;
}

export class HealthService {
  /**
   * Fetch comprehensive host and container health metrics
   */
  public static async getSystemMetrics(): Promise<SystemHealthMetrics> {
    const [cpuLoad, cpuInfo, memInfo, fsInfo, dockerStatus] = await Promise.all([
      si.currentLoad().catch(() => ({ currentLoad: 0 })),
      si.cpu().catch(() => ({ cores: 1, brand: 'Generic CPU' })),
      si.mem().catch(() => ({ total: 1024 * 1024 * 1024, active: 512 * 1024 * 1024, free: 512 * 1024 * 1024 })),
      si.fsSize().catch(() => ([{ size: 100 * 1024 * 1024 * 1024, used: 20 * 1024 * 1024 * 1024, available: 80 * 1024 * 1024 * 1024, use: 20 }])),
      DockerService.isDockerAvailable()
    ]);

    // Query control plane database counts
    let totalProjects = 0;
    let totalUsers = 0;
    let allocatedPorts = 0;
    let dbOk = false;

    try {
      totalProjects = (db.prepare("SELECT count(*) as count FROM projects WHERE status != 'DELETED'").get() as any)?.count || 0;
      totalUsers = (db.prepare("SELECT count(*) as count FROM users").get() as any)?.count || 0;
      allocatedPorts = (db.prepare("SELECT count(*) as count FROM assigned_ports WHERE status = 'ALLOCATED'").get() as any)?.count || 0;
      dbOk = true;
    } catch {
      dbOk = false;
    }

    const primaryFs = fsInfo[0] || { size: 1, used: 0, available: 1, use: 0 };

    return {
      cpu: {
        loadPercent: Math.round((cpuLoad.currentLoad || 0) * 10) / 10,
        cores: cpuInfo.cores || 1,
        model: cpuInfo.brand || 'Host CPU'
      },
      memory: {
        totalMb: Math.round(memInfo.total / 1024 / 1024),
        usedMb: Math.round(memInfo.active / 1024 / 1024),
        freeMb: Math.round(memInfo.free / 1024 / 1024),
        usagePercent: Math.round((memInfo.active / (memInfo.total || 1)) * 100)
      },
      disk: {
        totalGb: Math.round((primaryFs.size / 1024 / 1024 / 1024) * 10) / 10,
        usedGb: Math.round((primaryFs.used / 1024 / 1024 / 1024) * 10) / 10,
        freeGb: Math.round((primaryFs.available / 1024 / 1024 / 1024) * 10) / 10,
        usagePercent: Math.round(primaryFs.use || 0)
      },
      docker: dockerStatus,
      controlPlaneDb: {
        connected: dbOk,
        totalProjects,
        totalUsers,
        allocatedPorts
      },
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    };
  }
}
