import { Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { db } from '../config/database';
import { config } from '../config/env';
import { PortService } from '../services/port.service';
import { DockerService } from '../services/docker.service';
import { FileService } from '../services/file.service';
import { DatabaseService } from '../services/database.service';
import { AuditService } from '../services/audit.service';

const createProjectSchema = z.object({
  name: z.string().min(2).max(50),
  runtimeType: z.enum(['STATIC', 'PHP']),
  template: z.string().optional(),
  createDatabase: z.boolean().optional(),
  databaseEngine: z.enum(['POSTGRESQL', 'MYSQL']).optional(),
  documentRoot: z.string().optional(),
  domain: z.string().optional()
});

const updateProjectSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  domain: z.string().nullable().optional(),
  documentRoot: z.string().optional()
});

function resolveHost(req: AuthenticatedRequest): string {
  const hostHeader = req.get('x-forwarded-host') || req.get('host') || '';
  const hostname = hostHeader.split(':')[0] || req.hostname || config.serverIp;
  if (hostname && hostname !== '0.0.0.0' && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return hostname;
  }
  return config.serverIp;
}

export class ProjectsController {
  public static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const host = resolveHost(req);
      let query = `
        SELECT p.*, u.username as owner_username, u.email as owner_email,
               db.id as database_id, db.engine as database_engine, db.status as database_status
        FROM projects p
        LEFT JOIN users u ON p.owner_id = u.id
        LEFT JOIN database_instances db ON p.id = db.project_id
        WHERE p.status != 'DELETED'
      `;
      const params: any[] = [];

      if (user.role !== 'ADMIN') {
        query += ' AND p.owner_id = ?';
        params.push(user.userId);
      }

      query += ' ORDER BY p.created_at DESC';

      const projects = db.prepare(query).all(...params) as any[];

      const formatted = projects.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        ownerId: p.owner_id,
        ownerUsername: p.owner_username,
        runtimeType: p.runtime_type,
        port: p.port,
        url: p.port ? `http://${host}:${p.port}` : null,
        domain: p.domain,
        documentRoot: p.document_root,
        status: p.status,
        containerId: p.container_id,
        errorMessage: p.error_message,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        lastDeployedAt: p.last_deployed_at,
        hasDatabase: Boolean(p.database_id),
        databaseEngine: p.database_engine
      }));

      res.json({ projects: formatted });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = req.user!;

      const project = db.prepare(`
        SELECT p.*, u.username as owner_username, u.email as owner_email,
               db.id as database_id, db.engine as database_engine, db.status as database_status
        FROM projects p
        LEFT JOIN users u ON p.owner_id = u.id
        LEFT JOIN database_instances db ON p.id = db.project_id
        WHERE p.id = ? AND p.status != 'DELETED'
      `).get(id) as any;

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      if (user.role !== 'ADMIN' && project.owner_id !== user.userId) {
        res.status(403).json({ error: 'Access denied to this project.' });
        return;
      }

      const host = resolveHost(req);

      res.json({
        project: {
          id: project.id,
          name: project.name,
          slug: project.slug,
          ownerId: project.owner_id,
          ownerUsername: project.owner_username,
          runtimeType: project.runtime_type,
          port: project.port,
          url: project.port ? `http://${host}:${project.port}` : null,
          domain: project.domain,
          documentRoot: project.document_root,
          status: project.status,
          containerId: project.container_id,
          containerName: project.container_name,
          errorMessage: project.error_message,
          createdAt: project.created_at,
          updatedAt: project.updated_at,
          lastDeployedAt: project.last_deployed_at,
          hasDatabase: Boolean(project.database_id),
          databaseEngine: project.database_engine
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = req.user!;
      const project = await ProjectsController.getAuthorizedProject(id, user);
      const { name, domain, documentRoot } = updateProjectSchema.parse(req.body);

      const updates: string[] = [];
      const params: any[] = [];

      if (name !== undefined) {
        updates.push('name = ?');
        params.push(name);
      }
      if (domain !== undefined) {
        updates.push('domain = ?');
        params.push(domain || null);
      }
      if (documentRoot !== undefined) {
        const cleanDocRoot = documentRoot.trim() ? (documentRoot.startsWith('/') ? documentRoot : `/${documentRoot}`) : '/';
        updates.push('document_root = ?');
        params.push(cleanDocRoot);
      }

      if (updates.length === 0) {
        res.status(400).json({ error: 'No fields to update' });
        return;
      }

      updates.push("updated_at = datetime('now')");
      params.push(id);

      db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`).run(...params);

      // If document root was changed and project is running, re-provision container
      if (documentRoot !== undefined && project.status === 'RUNNING' && project.port) {
        const cleanDocRoot = documentRoot.trim() ? (documentRoot.startsWith('/') ? documentRoot : `/${documentRoot}`) : '/';
        try {
          const containerInfo = await DockerService.provisionProjectContainer({
            id: project.id,
            name: name || project.name,
            slug: project.slug,
            runtimeType: project.runtime_type,
            port: project.port,
            documentRoot: cleanDocRoot
          });

          db.prepare(`
            UPDATE projects
            SET container_id = ?, container_name = ?, error_message = NULL, updated_at = datetime('now')
            WHERE id = ?
          `).run(containerInfo.containerId, containerInfo.containerName, id);
        } catch (containerErr: any) {
          console.error('Failed to re-provision container on doc root update:', containerErr);
        }
      }

      AuditService.log({
        userId: user.userId,
        username: user.username,
        action: 'PROJECT_UPDATED',
        resourceType: 'PROJECT',
        resourceId: id,
        details: { name, domain, documentRoot }
      });

      res.json({ message: 'Project updated successfully' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  public static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    let allocatedPort: number | null = null;
    const projectId = crypto.randomUUID();

    try {
      const {
        name,
        runtimeType,
        template,
        createDatabase,
        databaseEngine,
        documentRoot = '/',
        domain
      } = createProjectSchema.parse(req.body);

      const baseSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 24);
      const randSuffix = crypto.randomBytes(2).toString('hex');
      const slug = `${baseSlug}-${randSuffix}`;

      // 1. Insert initial project record with status PROVISIONING
      db.prepare(`
        INSERT INTO projects (
          id, name, slug, owner_id, runtime_type, port, status, domain, document_root, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, NULL, 'PROVISIONING', ?, ?, datetime('now'), datetime('now'))
      `).run(projectId, name, slug, user.userId, runtimeType, domain || null, documentRoot);

      // 2. Allocate next available host port
      allocatedPort = await PortService.allocatePort(projectId);

      // 3. Initialize file structure
      await FileService.initStarterFiles(projectId, runtimeType, template);

      // 4. Optionally provision dedicated database
      let dbCredentials = null;
      if (createDatabase) {
        dbCredentials = await DatabaseService.provisionDatabase(
          projectId,
          slug,
          databaseEngine || 'POSTGRESQL'
        );
      }

      // 5. Spawn container
      let containerInfo: { containerId: string; containerName: string; log: string } | null = null;
      try {
        containerInfo = await DockerService.provisionProjectContainer({
          id: projectId,
          name,
          slug,
          runtimeType,
          port: allocatedPort,
          documentRoot
        });

        db.prepare(`
          UPDATE projects 
          SET status = 'RUNNING', container_id = ?, container_name = ?, last_deployed_at = datetime('now'), updated_at = datetime('now')
          WHERE id = ?
        `).run(containerInfo.containerId, containerInfo.containerName, projectId);

        db.prepare(`
          INSERT INTO deployments (id, project_id, status, log_output, triggered_by_user_id, created_at)
          VALUES (?, ?, 'SUCCESS', ?, ?, datetime('now'))
        `).run(crypto.randomUUID(), projectId, containerInfo.log, user.userId);

      } catch (containerErr: any) {
        db.prepare(`
          UPDATE projects 
          SET status = 'FAILED', error_message = ?, updated_at = datetime('now')
          WHERE id = ?
        `).run(containerErr.message, projectId);
      }

      AuditService.log({
        userId: user.userId,
        username: user.username,
        action: 'PROJECT_PROVISIONED',
        resourceType: 'PROJECT',
        resourceId: projectId,
        details: { name, slug, runtimeType, port: allocatedPort, createDatabase }
      });

      const host = resolveHost(req);

      res.status(201).json({
        message: 'Project provisioned successfully',
        project: {
          id: projectId,
          name,
          slug,
          runtimeType,
          port: allocatedPort,
          url: `http://${host}:${allocatedPort}`,
          status: containerInfo ? 'RUNNING' : 'FAILED',
          hasDatabase: Boolean(createDatabase),
          database: dbCredentials
        }
      });

    } catch (err: any) {
      if (allocatedPort) {
        await PortService.releasePort(allocatedPort, projectId).catch(() => {});
      }
      db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
      res.status(400).json({ error: err.message });
    }
  }

  public static async start(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const project = await ProjectsController.getAuthorizedProject(id, req.user!);

      const containerName = project.container_name || `mh_site_${project.slug}`;
      
      let port = project.port;
      if (!port) {
        port = await PortService.allocatePort(id);
        db.prepare('UPDATE projects SET port = ? WHERE id = ?').run(port, id);
      }

      let containerId = project.container_id;
      let newContainerName = containerName;

      try {
        await DockerService.startContainer(containerName);
      } catch (startErr: any) {
        // If container does not exist or failed to start, re-provision it seamlessly!
        const containerInfo = await DockerService.provisionProjectContainer({
          id: project.id,
          name: project.name,
          slug: project.slug,
          runtimeType: project.runtime_type,
          port: port,
          documentRoot: project.document_root
        });
        containerId = containerInfo.containerId;
        newContainerName = containerInfo.containerName;
        port = containerInfo.port;
      }

      db.prepare(`
        UPDATE projects 
        SET status = 'RUNNING', port = ?, container_id = ?, container_name = ?, error_message = NULL, updated_at = datetime('now') 
        WHERE id = ?
      `).run(port, containerId, newContainerName, id);

      AuditService.log({
        userId: req.user!.userId,
        username: req.user!.username,
        action: 'PROJECT_STARTED',
        resourceType: 'PROJECT',
        resourceId: id
      });

      res.json({ message: 'Project started successfully', status: 'RUNNING' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  public static async stop(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const project = await ProjectsController.getAuthorizedProject(id, req.user!);

      const containerName = project.container_name || `mh_site_${project.slug}`;
      await DockerService.stopContainer(containerName).catch(() => {});

      db.prepare("UPDATE projects SET status = 'STOPPED', updated_at = datetime('now') WHERE id = ?").run(id);

      AuditService.log({
        userId: req.user!.userId,
        username: req.user!.username,
        action: 'PROJECT_STOPPED',
        resourceType: 'PROJECT',
        resourceId: id
      });

      res.json({ message: 'Project stopped successfully', status: 'STOPPED' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  public static async restart(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const project = await ProjectsController.getAuthorizedProject(id, req.user!);

      let port = project.port;
      if (!port) {
        port = await PortService.allocatePort(id);
        db.prepare('UPDATE projects SET port = ? WHERE id = ?').run(port, id);
      }

      const containerInfo = await DockerService.provisionProjectContainer({
        id: project.id,
        name: project.name,
        slug: project.slug,
        runtimeType: project.runtime_type,
        port: port,
        documentRoot: project.document_root
      });

      db.prepare(`
        UPDATE projects 
        SET status = 'RUNNING', port = ?, container_id = ?, container_name = ?, error_message = NULL, last_deployed_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ?
      `).run(containerInfo.port, containerInfo.containerId, containerInfo.containerName, id);

      AuditService.log({
        userId: req.user!.userId,
        username: req.user!.username,
        action: 'PROJECT_RESTARTED',
        resourceType: 'PROJECT',
        resourceId: id
      });

      res.json({ message: 'Project container restarted and refreshed', status: 'RUNNING' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  public static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const project = await ProjectsController.getAuthorizedProject(id, req.user!);

      const containerName = project.container_name || `mh_site_${project.slug}`;
      await DockerService.removeContainer(containerName).catch(() => {});

      await DatabaseService.deleteDatabase(id).catch(() => {});

      if (project.port) {
        await PortService.releasePort(project.port, id);
      }

      await FileService.deletePath(id, '').catch(() => {});

      db.prepare("UPDATE projects SET status = 'DELETED', port = NULL, updated_at = datetime('now') WHERE id = ?").run(id);

      AuditService.log({
        userId: req.user!.userId,
        username: req.user!.username,
        action: 'PROJECT_DELETED',
        resourceType: 'PROJECT',
        resourceId: id,
        details: { name: project.name, slug: project.slug, port: project.port }
      });

      res.json({ message: 'Project deleted and resources cleanly released.' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  public static async getLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const project = await ProjectsController.getAuthorizedProject(id, req.user!);

      const containerName = project.container_name || `mh_site_${project.slug}`;
      const logs = await DockerService.getContainerLogs(containerName);

      res.json({ logs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public static async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const project = await ProjectsController.getAuthorizedProject(id, req.user!);

      const containerName = project.container_name || `mh_site_${project.slug}`;
      const stats = await DockerService.getContainerStats(containerName);
      const storageBytes = await FileService.getStorageUsage(id);

      res.json({
        stats,
        storageBytes,
        storageMb: Math.round((storageBytes / 1024 / 1024) * 100) / 100
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  private static async getAuthorizedProject(id: string, user: { userId: string; role: string }): Promise<any> {
    const project = db.prepare('SELECT * FROM projects WHERE id = ? AND status != \'DELETED\'').get(id) as any;
    if (!project) {
      throw new Error('Project not found or already deleted');
    }
    if (user.role !== 'ADMIN' && project.owner_id !== user.userId) {
      throw new Error('Access denied: You do not have permission to manage this project');
    }
    return project;
  }
}
