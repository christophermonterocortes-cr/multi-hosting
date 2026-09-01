import { execFile } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';
import { config } from '../config/env';
import { FileService } from './file.service';

const execFileAsync = util.promisify(execFile);

export interface ContainerStats {
  status: 'running' | 'stopped' | 'restarting' | 'exited' | 'unknown';
  cpuPercent: string;
  memoryUsage: string;
  memoryLimit: string;
  uptime: string;
}

export class DockerService {
  /**
   * Execute a docker/podman command using execFile with safe array arguments
   */
  private static async runDocker(args: string[], timeoutMs = 60000): Promise<{ stdout: string; stderr: string }> {
    try {
      const binary = 'docker';
      const env = {
        ...process.env,
        DOCKER_HOST: process.env.DOCKER_HOST || (config.dockerSocketPath ? `unix://${config.dockerSocketPath}` : undefined)
      };
      
      const { stdout, stderr } = await execFileAsync(binary, args, { env, timeout: timeoutMs });
      return { stdout: stdout.trim(), stderr: stderr.trim() };
    } catch (err: any) {
      throw new Error(`Docker execution failed [${args.join(' ')}]: ${err.stderr || err.message}`);
    }
  }

  /**
   * Health check to test connectivity to Docker / Podman Engine
   */
  public static async isDockerAvailable(): Promise<{ available: boolean; version?: string; error?: string }> {
    try {
      const { stdout } = await this.runDocker(['version', '--format', '{{.Server.Version}}']);
      return { available: true, version: stdout || 'Engine Active' };
    } catch (err: any) {
      return { available: false, error: err.message };
    }
  }

  /**
   * Get all published host ports across all running/created containers on the Docker daemon
   */
  public static async getAllPublishedHostPorts(): Promise<Set<number>> {
    const published = new Set<number>();
    try {
      const { stdout } = await this.runDocker(['ps', '-a', '--format', '{{.Ports}}'], 5000);
      const lines = stdout.split('\n');
      for (const line of lines) {
        // Matches patterns like 0.0.0.0:17001->80/tcp, [::]:17001->80/tcp, 0.0.0.0:6001-6002->6001-6002/tcp
        const matches = line.matchAll(/(?:0\.0\.0\.0|\[::\]|:):?(\d+)(?:-(\d+))?->/g);
        for (const m of matches) {
          const start = parseInt(m[1], 10);
          const end = m[2] ? parseInt(m[2], 10) : start;
          if (!isNaN(start) && !isNaN(end)) {
            for (let p = start; p <= end; p++) {
              published.add(p);
            }
          }
        }
      }
    } catch {
      // If docker command fails, return empty set
    }
    return published;
  }

  /**
   * Provision and run a new container for a project
   */
  public static async provisionProjectContainer(project: {
    id: string;
    name: string;
    slug: string;
    runtimeType: 'STATIC' | 'PHP';
    port: number;
    documentRoot?: string;
  }): Promise<{ containerId: string; containerName: string; port: number; log: string }> {
    const containerName = `mh_site_${project.slug}`;
    
    // Internal path for filesystem operations
    const internalProjectRoot = FileService.getProjectRoot(project.id);
    const internalDocRoot = project.documentRoot && project.documentRoot !== '/'
      ? path.join(internalProjectRoot, project.documentRoot)
      : internalProjectRoot;

    // Ensure document root directory exists internally
    if (!fs.existsSync(internalDocRoot)) {
      fs.mkdirSync(internalDocRoot, { recursive: true });
    }

    // Host path for Docker daemon sibling volume mount
    const hostProjectRoot = path.join(config.hostDataDir, 'projects', project.id);
    const hostDocRoot = project.documentRoot && project.documentRoot !== '/'
      ? path.join(hostProjectRoot, project.documentRoot)
      : hostProjectRoot;

    // Teardown existing container if it exists
    await this.removeContainer(containerName).catch(() => {});

    // Ensure runtime image exists or is built
    let runtimeImage = project.runtimeType === 'STATIC'
      ? 'multihosting-runtime-static:latest'
      : 'multihosting-runtime-php:latest';

    const hasCustom = await this.imageExists(runtimeImage);
    if (!hasCustom) {
      if (project.runtimeType === 'STATIC') {
        try {
          const staticDir = fs.existsSync(path.join(config.runtimesDir, 'static'))
            ? path.join(config.runtimesDir, 'static')
            : path.join(config.hostRuntimesDir, 'static');
          await this.runDocker(['build', '-t', runtimeImage, staticDir], 180000);
        } catch (e: any) {
          console.warn('Failed to build custom static image, falling back to nginx:alpine:', e.message);
          runtimeImage = 'nginx:alpine';
        }
      } else {
        try {
          const phpDir = fs.existsSync(path.join(config.runtimesDir, 'php'))
            ? path.join(config.runtimesDir, 'php')
            : path.join(config.hostRuntimesDir, 'php');
          await this.runDocker(['build', '-t', runtimeImage, phpDir], 300000);
        } catch (e: any) {
          console.warn('Failed to build custom PHP image, checking image availability:', e.message);
          const hasBasePhp = await this.imageExists('php:8.2-apache');
          if (!hasBasePhp) {
            await this.runDocker(['pull', 'php:8.2-apache']).catch(() => {});
          }
          runtimeImage = 'php:8.2-apache';
        }
      }
    }

    const volumeArg = project.runtimeType === 'STATIC'
      ? `${hostDocRoot}:/var/www/html:ro`
      : `${hostDocRoot}:/var/www/html:rw`;

    const { PortService } = await import('./port.service');
    let lastError: any = null;
    let currentPort = project.port;

    for (let attempt = 0; attempt < 5; attempt++) {
      const runArgs = [
        'run',
        '-d',
        '--name', containerName,
        '--restart', 'unless-stopped',
        '-p', `0.0.0.0:${currentPort}:80`,
        '--memory', '256m',
        '--cpus', '1.0',
        '-v', volumeArg,
        runtimeImage
      ];

      try {
        const { stdout: containerId } = await this.runDocker(runArgs);

        return {
          containerId,
          containerName,
          port: currentPort,
          log: `Container ${containerName} started on port ${currentPort} (ID: ${containerId.substring(0, 12)})`
        };
      } catch (err: any) {
        lastError = err;
        const msg = err.message || '';
        if (
          msg.includes('port is already allocated') ||
          msg.includes('address already in use') ||
          msg.includes('Bind for 0.0.0.0') ||
          msg.includes('failed to set up container networking')
        ) {
          console.warn(`⚠️ Port conflict detected on port ${currentPort}. Auto-reallocating next free port and retrying (attempt ${attempt + 1})...`);
          PortService.markPortOccupied(currentPort);
          await this.removeContainer(containerName).catch(() => {});
          currentPort = await PortService.allocatePort(project.id);
          project.port = currentPort;
          continue;
        }
        throw err;
      }
    }

    throw lastError || new Error(`Failed to provision container ${containerName} after port conflict retries`);
  }

  /**
   * Check if a docker image exists locally
   */
  public static async imageExists(imageName: string): Promise<boolean> {
    try {
      await this.runDocker(['image', 'inspect', imageName]);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Start a stopped container
   */
  public static async startContainer(containerName: string): Promise<void> {
    await this.runDocker(['start', containerName]);
  }

  /**
   * Stop a running container
   */
  public static async stopContainer(containerName: string): Promise<void> {
    await this.runDocker(['stop', '-t', '5', containerName]);
  }

  /**
   * Restart a container
   */
  public static async restartContainer(containerName: string): Promise<void> {
    await this.runDocker(['restart', '-t', '5', containerName]);
  }

  /**
   * Stop and remove a container
   */
  public static async removeContainer(containerName: string): Promise<void> {
    try {
      await this.runDocker(['rm', '-f', containerName]);
    } catch {
      // Ignore if container did not exist
    }
  }

  /**
   * Get live logs from container (stdout/stderr)
   */
  public static async getContainerLogs(containerName: string, tail = 150): Promise<string> {
    try {
      const { stdout, stderr } = await this.runDocker(['logs', '--tail', tail.toString(), '--timestamps', containerName]);
      return stdout || stderr || 'No logs recorded yet.';
    } catch (err: any) {
      return `Failed to fetch logs: ${err.message}`;
    }
  }

  /**
   * Get container status and performance metrics
   */
  public static async getContainerStats(containerName: string): Promise<ContainerStats> {
    try {
      const { stdout } = await this.runDocker([
        'inspect',
        '--format',
        '{{.State.Status}}|{{.State.StartedAt}}|{{.State.Running}}',
        containerName
      ]);

      const [status, startedAt, isRunning] = stdout.split('|');

      let cpu = '0.0%';
      let mem = '0 MB';
      let limit = '256 MB';

      if (isRunning === 'true') {
        try {
          const statsOutput = await this.runDocker([
            'stats',
            '--no-stream',
            '--format',
            '{{.CPUPerc}}|{{.MemUsage}}',
            containerName
          ], 5000);
          const [c, m] = statsOutput.stdout.split('|');
          if (c) cpu = c.trim();
          if (m) {
            const parts = m.split('/');
            mem = parts[0]?.trim() || '0 MB';
            limit = parts[1]?.trim() || '256 MB';
          }
        } catch {
          // Stats may fail if container stopped in the middle
        }
      }

      return {
        status: (status as any) || 'unknown',
        cpuPercent: cpu,
        memoryUsage: mem,
        memoryLimit: limit,
        uptime: startedAt ? new Date(startedAt).toLocaleString() : 'N/A'
      };
    } catch {
      return {
        status: 'stopped',
        cpuPercent: '0%',
        memoryUsage: '0 MB',
        memoryLimit: '256 MB',
        uptime: 'Offline'
      };
    }
  }

  /**
   * Automatically discover and reconcile all running or stopped mh_site_* Docker containers into the SQLite database
   */
  public static async reconcileExistingContainers(): Promise<number> {
    try {
      const { db } = await import('../config/database');
      const { encrypt } = await import('../utils/crypto');

      const adminUser = db.prepare("SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1").get() as { id: string } | undefined;
      const ownerId = adminUser?.id || 'admin-default-id';

      const { stdout } = await this.runDocker(['ps', '-a', '--filter', 'name=mh_site_', '--format', '{{.ID}}|{{.Names}}'], 10000);
      if (!stdout) return 0;

      const lines = stdout.split('\n').filter(Boolean);
      let count = 0;

      // Get DBs
      let mariaDbs: string[] = [];
      try {
        const { stdout: mOut } = await this.runDocker(['exec', 'multihosting_managed_mariadb', 'mariadb', '-uroot', '-pmysql_admin_pass_multi_hosting', '-e', 'SHOW DATABASES;', '-s', '-N'], 5000);
        mariaDbs = mOut.split('\n').filter(d => d.startsWith('db_'));
      } catch {}

      let pgDbs: string[] = [];
      try {
        const { stdout: pOut } = await this.runDocker(['exec', 'multihosting_managed_postgres', 'psql', '-U', 'postgres', '-t', '-A', '-c', "SELECT datname FROM pg_database WHERE datname LIKE 'db_%';"], 5000);
        pgDbs = pOut.split('\n').filter(d => d.startsWith('db_'));
      } catch {}

      const checkProject = db.prepare('SELECT id, port, status FROM projects WHERE id = ? OR slug = ?');
      const insertProject = db.prepare(`
        INSERT INTO projects (
          id, name, slug, owner_id, runtime_type, port, status, domain, document_root, container_id, container_name, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `);
      const updateProject = db.prepare(`
        UPDATE projects SET status = ?, port = ?, container_id = ?, container_name = ?, updated_at = datetime('now') WHERE id = ?
      `);
      const insertPort = db.prepare(`
        INSERT OR REPLACE INTO assigned_ports (port, project_id, status, allocated_at) VALUES (?, ?, 'ALLOCATED', datetime('now'))
      `);
      const checkDb = db.prepare('SELECT id FROM database_instances WHERE project_id = ?');
      const insertDb = db.prepare(`
        INSERT OR REPLACE INTO database_instances (
          id, project_id, engine, db_name, db_user, encrypted_password, iv, auth_tag, host, port, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
      `);

      for (const line of lines) {
        const [cId, cName] = line.split('|');
        if (!cId) continue;

        try {
          const { stdout: inspectOut } = await this.runDocker(['inspect', cId], 5000);
          const info = JSON.parse(inspectOut)[0];
          if (!info) continue;

          const containerName = (info.Name || cName || '').replace(/^\//, '');
          const slug = containerName.replace(/^mh_site_/, '');

          let projectId = '';
          const mounts = info.Mounts || [];
          for (const m of mounts) {
            if (m.Destination === '/var/www/html' || m.Destination === '/var/www/html/public') {
              const parts = m.Source.split('/');
              projectId = parts[parts.length - 1];
              break;
            }
          }
          if (!projectId || projectId === 'html') {
            projectId = `proj-${slug}`;
          }

          const image = info.Config?.Image || '';
          const isPhp = image.includes('php') || (info.NetworkSettings?.Ports && '9000/tcp' in info.NetworkSettings.Ports);
          const runtimeType = isPhp ? 'PHP' : 'STATIC';

          let hostPort: number | null = null;
          const portBindings = info.HostConfig?.PortBindings || info.NetworkSettings?.Ports || {};
          const httpBinding = portBindings['80/tcp'];
          if (httpBinding && httpBinding.length > 0 && httpBinding[0].HostPort) {
            hostPort = parseInt(httpBinding[0].HostPort, 10);
          }

          const name = slug
            .split('-')
            .slice(0, -1)
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ') || slug;

          const status = info.State?.Running ? 'RUNNING' : 'STOPPED';

          // Ensure project directory exists on disk
          const projDir = path.join(config.projectsDir, projectId);
          if (!fs.existsSync(projDir)) {
            fs.mkdirSync(projDir, { recursive: true });
          }

          // Check if already in SQLite
          const existing = checkProject.get(projectId, slug) as { id: string; port: number; status: string } | undefined;
          if (existing) {
            updateProject.run(status, hostPort || existing.port, info.Id, containerName, existing.id);
          } else {
            insertProject.run(
              projectId,
              name,
              slug,
              ownerId,
              runtimeType,
              hostPort,
              status,
              null,
              '/',
              info.Id,
              containerName
            );
            count++;
          }

          if (hostPort) {
            insertPort.run(hostPort, projectId);
          }

          // Link DB if not linked
          if (!checkDb.get(projectId)) {
            const slugClean = slug.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            const matchedMaria = mariaDbs.find(d => d.includes(slugClean.slice(0, 8)));
            const matchedPg = pgDbs.find(d => d.includes(slugClean.slice(0, 8)));

            if (matchedMaria) {
              const dbUser = 'u_' + matchedMaria.slice(3);
              const enc = encrypt('^#wyH2$RJXihki+sDTYjSYTo');
              insertDb.run(
                `db-${projectId}`,
                projectId,
                'MYSQL',
                matchedMaria,
                dbUser,
                enc.encryptedText,
                enc.iv,
                enc.authTag,
                'mariadb-managed',
                3306
              );
            } else if (matchedPg) {
              const dbUser = 'u_' + matchedPg.slice(3);
              const enc = encrypt('^#wyH2$RJXihki+sDTYjSYTo');
              insertDb.run(
                `db-${projectId}`,
                projectId,
                'POSTGRESQL',
                matchedPg,
                dbUser,
                enc.encryptedText,
                enc.iv,
                enc.authTag,
                'postgres-managed',
                5432
              );
            }
          }
        } catch (itemErr: any) {
          console.warn(`Could not reconcile container ${cId}:`, itemErr.message);
        }
      }

      return count;
    } catch (err: any) {
      console.error('Reconcile existing containers failed:', err.message);
      return 0;
    }
  }
}
