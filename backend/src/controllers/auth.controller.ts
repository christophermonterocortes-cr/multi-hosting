import { Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { db } from '../config/database';

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain alphanumeric characters, underscores, and dashes'),
  password: z.string().min(8, 'Password must be at least 8 characters long')
});

const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1)
});

export class AuthController {
  public static async register(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, username, password } = registerSchema.parse(req.body);
      const user = await AuthService.register(email, username, password, 'USER', req.user ? { id: req.user.userId, email: req.user.email, username: req.user.username, role: req.user.role, isActive: true, createdAt: '' } : undefined);
      const token = AuthService.generateToken(user);
      res.status(201).json({ message: 'User registered successfully', user, token });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  public static async login(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { identifier, password } = loginSchema.parse(req.body);
      const ip = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const result = await AuthService.login(identifier, password, ip, userAgent);
      res.json({ message: 'Login successful', ...result });
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  }

  public static async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const userRow = db.prepare('SELECT id, email, username, role, is_active, created_at FROM users WHERE id = ?').get(req.user.userId) as any;
      if (!userRow) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      res.json({
        user: {
          id: userRow.id,
          email: userRow.email,
          username: userRow.username,
          role: userRow.role,
          isActive: Boolean(userRow.is_active),
          createdAt: userRow.created_at
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
