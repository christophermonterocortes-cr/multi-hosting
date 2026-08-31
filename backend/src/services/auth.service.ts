import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../config/database';
import { config } from '../config/env';
import { AuditService } from './audit.service';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  createdAt: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
  role: 'ADMIN' | 'USER';
}

export class AuthService {
  /**
   * Seed the default admin user if no users exist
   */
  public static async seedDefaultAdmin(): Promise<void> {
    const userCount = (db.prepare('SELECT count(*) as count FROM users').get() as any)?.count || 0;
    if (userCount === 0) {
      const id = crypto.randomUUID();
      const hash = await bcrypt.hash(config.defaultAdminPassword, 12);
      
      db.prepare(`
        INSERT INTO users (id, email, username, password_hash, role, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'ADMIN', 1, datetime('now'), datetime('now'))
      `).run(id, config.defaultAdminEmail, config.defaultAdminUsername, hash);

      AuditService.log({
        userId: id,
        username: config.defaultAdminUsername,
        action: 'SYSTEM_BOOTSTRAP_ADMIN_CREATED',
        resourceType: 'USER',
        resourceId: id,
        details: { email: config.defaultAdminEmail, username: config.defaultAdminUsername }
      });

      console.log(`🔑 Default Administrator created: ${config.defaultAdminUsername} (${config.defaultAdminEmail})`);
    }
  }

  /**
   * Register a new user
   */
  public static async register(email: string, username: string, password: string, role: 'ADMIN' | 'USER' = 'USER', creatorUser?: AuthUser): Promise<AuthUser> {
    // Check if user registrations are allowed (if regular self-registration)
    if (!creatorUser || creatorUser.role !== 'ADMIN') {
      const allowReg = (db.prepare("SELECT value FROM system_settings WHERE key = 'allow_user_registrations'").get() as any)?.value;
      if (allowReg === 'false') {
        throw new Error('Self-registration is currently disabled by administrator.');
      }
      role = 'USER'; // Non-admin cannot create ADMIN
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
    if (existing) {
      throw new Error('User with this email or username already exists.');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    const id = crypto.randomUUID();
    const hash = await bcrypt.hash(password, 12);

    db.prepare(`
      INSERT INTO users (id, email, username, password_hash, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
    `).run(id, email.toLowerCase().trim(), username.trim(), hash, role);

    AuditService.log({
      userId: creatorUser?.id || id,
      username: creatorUser?.username || username,
      action: 'USER_REGISTERED',
      resourceType: 'USER',
      resourceId: id,
      details: { email, username, role }
    });

    return {
      id,
      email,
      username,
      role,
      isActive: true,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Authenticate user with lockout protection
   */
  public static async login(identifier: string, password: string, ipAddress?: string, userAgent?: string): Promise<{ user: AuthUser; token: string }> {
    const userRow = db.prepare(`
      SELECT * FROM users WHERE email = ? OR username = ?
    `).get(identifier.toLowerCase().trim(), identifier.trim()) as any;

    if (!userRow) {
      throw new Error('Invalid credentials');
    }

    // Check account lockout
    if (userRow.locked_until) {
      const lockDate = new Date(userRow.locked_until);
      if (lockDate > new Date()) {
        const remainingMinutes = Math.ceil((lockDate.getTime() - Date.now()) / 60000);
        throw new Error(`Account is temporarily locked due to repeated failed login attempts. Try again in ${remainingMinutes} minutes.`);
      } else {
        // Reset lock after expiry
        db.prepare('UPDATE users SET locked_until = NULL, failed_login_attempts = 0 WHERE id = ?').run(userRow.id);
      }
    }

    if (!userRow.is_active) {
      throw new Error('Account is deactivated. Please contact an administrator.');
    }

    const match = await bcrypt.compare(password, userRow.password_hash);
    if (!match) {
      const attempts = userRow.failed_login_attempts + 1;
      let lockUntil: string | null = null;

      if (attempts >= config.authMaxAttempts) {
        lockUntil = new Date(Date.now() + config.authLockoutDurationMs).toISOString();
      }

      db.prepare(`
        UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?
      `).run(attempts, lockUntil, userRow.id);

      AuditService.log({
        userId: userRow.id,
        username: userRow.username,
        action: lockUntil ? 'AUTH_ACCOUNT_LOCKED' : 'AUTH_FAILED_LOGIN',
        resourceType: 'AUTH',
        ipAddress,
        userAgent,
        details: { attempts, locked: !!lockUntil }
      });

      if (lockUntil) {
        throw new Error('Too many failed login attempts. Account has been locked for 15 minutes.');
      }
      throw new Error('Invalid credentials');
    }

    // Reset failed login counter on success
    db.prepare('UPDATE users SET failed_login_attempts = 0, locked_until = NULL, updated_at = datetime(\'now\') WHERE id = ?').run(userRow.id);

    const authUser: AuthUser = {
      id: userRow.id,
      email: userRow.email,
      username: userRow.username,
      role: userRow.role,
      isActive: Boolean(userRow.is_active),
      createdAt: userRow.created_at
    };

    const token = this.generateToken(authUser);

    AuditService.log({
      userId: authUser.id,
      username: authUser.username,
      action: 'AUTH_SUCCESS_LOGIN',
      resourceType: 'AUTH',
      ipAddress,
      userAgent
    });

    return { user: authUser, token };
  }

  /**
   * Generate JWT Token
   */
  public static generateToken(user: AuthUser): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    };

    return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn as any });
  }

  /**
   * Verify and decode JWT Token
   */
  public static verifyToken(token: string): JwtPayload {
    return jwt.verify(token, config.jwtSecret) as JwtPayload;
  }
}
