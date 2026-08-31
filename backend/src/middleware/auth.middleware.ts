import { Request, Response, NextFunction } from 'express';
import { AuthService, JwtPayload } from '../services/auth.service';
import { db } from '../config/database';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload & { isActive: boolean };
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = AuthService.verifyToken(token);

    // Verify user exists and is active in database
    const user = db.prepare('SELECT is_active FROM users WHERE id = ?').get(payload.userId) as any;
    if (!user || !user.is_active) {
      res.status(403).json({ error: 'User account is deactivated or deleted.' });
      return;
    }

    req.user = {
      ...payload,
      isActive: Boolean(user.is_active)
    };

    next();
  } catch (err: any) {
    res.status(401).json({ error: 'Invalid or expired token.' });
    return;
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Access denied: Administrator privileges required.' });
    return;
  }
  next();
}
