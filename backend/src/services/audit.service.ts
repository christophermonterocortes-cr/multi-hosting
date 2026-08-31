import crypto from 'crypto';
import { db } from '../config/database';
import { maskSensitiveData } from '../utils/crypto';

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  username: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  details: any;
  createdAt: string;
}

export class AuditService {
  /**
   * Record an administrative or user event in the audit trail
   */
  public static log(entry: {
    userId?: string | null;
    username?: string | null;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    details?: any;
  }): void {
    try {
      const id = crypto.randomUUID();
      const sanitizedDetails = entry.details ? JSON.stringify(maskSensitiveData(entry.details)) : null;

      db.prepare(`
        INSERT INTO audit_logs (
          id, user_id, username, action, resource_type, resource_id, ip_address, user_agent, details_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        id,
        entry.userId || null,
        entry.username || null,
        entry.action,
        entry.resourceType,
        entry.resourceId || null,
        entry.ipAddress || null,
        entry.userAgent || null,
        sanitizedDetails
      );
    } catch (err: any) {
      console.error('Failed to write audit log:', err.message);
    }
  }

  /**
   * Retrieve paginated audit logs
   */
  public static getLogs(limit = 50, offset = 0, actionFilter?: string): { logs: AuditLogEntry[]; total: number } {
    let query = 'SELECT * FROM audit_logs';
    let countQuery = 'SELECT count(*) as count FROM audit_logs';
    const params: any[] = [];

    if (actionFilter) {
      query += ' WHERE action LIKE ?';
      countQuery += ' WHERE action LIKE ?';
      params.push(`%${actionFilter}%`);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    const total = (db.prepare(countQuery).get(...params) as any)?.count || 0;
    const rows = db.prepare(query).all(...params, limit, offset) as any[];

    const logs: AuditLogEntry[] = rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      username: r.username,
      action: r.action,
      resourceType: r.resource_type,
      resourceId: r.resource_id,
      ipAddress: r.ip_address,
      userAgent: r.user_agent,
      details: r.details_json ? JSON.parse(r.details_json) : null,
      createdAt: r.created_at
    }));

    return { logs, total };
  }
}
