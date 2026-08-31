import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { db } from '../config/database';
import { DatabaseService } from '../services/database.service';
import { AuditService } from '../services/audit.service';

const provisionDbSchema = z.object({
  engine: z.enum(['POSTGRESQL', 'MYSQL']).default('POSTGRESQL')
});

export class DatabasesController {
  public static async listAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user!;
      let rows: any[];
      if (user.role === 'ADMIN') {
        rows = db.prepare(`
          SELECT d.id, d.project_id, p.name as project_name, p.slug as project_slug,
                 d.engine, d.db_name, d.db_user, d.host, d.port, d.created_at, d.updated_at
          FROM database_instances d
          JOIN projects p ON d.project_id = p.id
          WHERE p.status != 'DELETED'
          ORDER BY d.created_at DESC
        `).all();
      } else {
        rows = db.prepare(`
          SELECT d.id, d.project_id, p.name as project_name, p.slug as project_slug,
                 d.engine, d.db_name, d.db_user, d.host, d.port, d.created_at, d.updated_at
          FROM database_instances d
          JOIN projects p ON d.project_id = p.id
          WHERE p.owner_id = ? AND p.status != 'DELETED'
          ORDER BY d.created_at DESC
        `).all(user.userId);
      }

      const databases = rows.map(r => ({
        id: r.id,
        projectId: r.project_id,
        projectName: r.project_name,
        projectSlug: r.project_slug,
        engine: r.engine,
        dbName: r.db_name,
        dbUser: r.db_user,
        host: r.host,
        port: r.port,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));

      res.json({ databases });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public static async provision(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { engine } = provisionDbSchema.parse(req.body);
      const user = req.user!;

      const project = db.prepare('SELECT slug, owner_id FROM projects WHERE id = ? AND status != \'DELETED\'').get(id) as any;
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      if (user.role !== 'ADMIN' && project.owner_id !== user.userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const credentials = await DatabaseService.provisionDatabase(id, project.slug, engine);

      AuditService.log({
        userId: user.userId,
        username: user.username,
        action: 'DATABASE_PROVISIONED',
        resourceType: 'DATABASE',
        resourceId: id,
        details: { engine, dbName: credentials.dbName, dbUser: credentials.dbUser }
      });

      res.status(201).json({
        message: 'Database provisioned successfully',
        database: credentials
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  public static async getCredentials(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const revealPassword = req.query.revealPassword === 'true';
      const user = req.user!;

      const project = db.prepare('SELECT owner_id FROM projects WHERE id = ? AND status != \'DELETED\'').get(id) as any;
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      if (user.role !== 'ADMIN' && project.owner_id !== user.userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const credentials = await DatabaseService.getDatabaseCredentials(id, revealPassword);
      if (!credentials) {
        res.status(404).json({ error: 'No database provisioned for this project' });
        return;
      }

      res.json({ database: credentials });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public static async regeneratePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = req.user!;

      const project = db.prepare('SELECT owner_id FROM projects WHERE id = ? AND status != \'DELETED\'').get(id) as any;
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      if (user.role !== 'ADMIN' && project.owner_id !== user.userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const credentials = await DatabaseService.regeneratePassword(id);

      AuditService.log({
        userId: user.userId,
        username: user.username,
        action: 'DATABASE_PASSWORD_REGENERATED',
        resourceType: 'DATABASE',
        resourceId: id,
        details: { dbName: credentials.dbName, dbUser: credentials.dbUser }
      });

      res.json({
        message: 'Database password regenerated successfully',
        database: credentials
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  public static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const user = req.user!;

      const project = db.prepare('SELECT owner_id FROM projects WHERE id = ? AND status != \'DELETED\'').get(id) as any;
      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      if (user.role !== 'ADMIN' && project.owner_id !== user.userId) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      await DatabaseService.deleteDatabase(id);

      AuditService.log({
        userId: user.userId,
        username: user.username,
        action: 'DATABASE_DELETED',
        resourceType: 'DATABASE',
        resourceId: id
      });

      res.json({ message: 'Database instance removed' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
