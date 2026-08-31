import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { db } from '../config/database';
import { AuthService } from '../services/auth.service';
import { AuditService } from '../services/audit.service';

const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'USER']).default('USER')
});

const updateUserSchema = z.object({
  role: z.enum(['ADMIN', 'USER']).optional(),
  isActive: z.boolean().optional()
});

export class UsersController {
  public static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const users = db.prepare(`
        SELECT u.id, u.email, u.username, u.role, u.is_active, u.created_at, u.updated_at,
               (SELECT count(*) FROM projects WHERE owner_id = u.id AND status != 'DELETED') as project_count
        FROM users u
        ORDER BY u.created_at DESC
      `).all() as any[];

      const formatted = users.map(u => ({
        id: u.id,
        email: u.email,
        username: u.username,
        role: u.role,
        isActive: Boolean(u.is_active),
        projectCount: u.project_count,
        createdAt: u.created_at,
        updatedAt: u.updated_at
      }));

      res.json({ users: formatted });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, username, password, role } = createUserSchema.parse(req.body);
      const user = await AuthService.register(email, username, password, role, {
        id: req.user!.userId,
        email: req.user!.email,
        username: req.user!.username,
        role: req.user!.role,
        isActive: true,
        createdAt: ''
      });

      res.status(201).json({ message: 'User created successfully', user });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  public static async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { role, isActive } = updateUserSchema.parse(req.body);

      if (id === req.user!.userId) {
        if (isActive === false) {
          res.status(400).json({ error: 'You cannot deactivate your own administrative account.' });
          return;
        }
        if (role && role !== 'ADMIN') {
          res.status(400).json({ error: 'You cannot remove your own administrator role.' });
          return;
        }
      }

      if (role !== undefined) {
        db.prepare('UPDATE users SET role = ?, updated_at = datetime(\'now\') WHERE id = ?').run(role, id);
      }
      if (isActive !== undefined) {
        db.prepare('UPDATE users SET is_active = ?, updated_at = datetime(\'now\') WHERE id = ?').run(isActive ? 1 : 0, id);
      }

      AuditService.log({
        userId: req.user!.userId,
        username: req.user!.username,
        action: 'USER_UPDATED',
        resourceType: 'USER',
        resourceId: id,
        details: { role, isActive }
      });

      res.json({ message: 'User updated successfully' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  public static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      if (id === req.user!.userId) {
        res.status(400).json({ error: 'You cannot delete your own account.' });
        return;
      }

      db.prepare('DELETE FROM users WHERE id = ?').run(id);

      AuditService.log({
        userId: req.user!.userId,
        username: req.user!.username,
        action: 'USER_DELETED',
        resourceType: 'USER',
        resourceId: id
      });

      res.json({ message: 'User deleted successfully' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  public static async resetPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { password } = z.object({ password: z.string().min(8, 'Password must be at least 8 characters long') }).parse(req.body);

      await AuthService.adminResetPassword(req.user!.userId, req.user!.username, id, password);
      res.json({ message: 'User password reset successfully' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
