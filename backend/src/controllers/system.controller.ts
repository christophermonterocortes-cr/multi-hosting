import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { HealthService } from '../services/health.service';
import { db } from '../config/database';
import { AuditService } from '../services/audit.service';

export class SystemController {
  /**
   * System health check endpoint
   */
  public static async getHealth(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const metrics = await HealthService.getSystemMetrics();
      res.json(metrics);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Get system settings (Admin only)
   */
  public static async getSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const settings = db.prepare('SELECT * FROM system_settings').all() as any[];
      res.json({ settings });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Update system settings (Admin only)
   */
  public static async updateSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { settings } = req.body;
      if (!settings || !Array.isArray(settings)) {
        res.status(400).json({ error: 'Settings array required' });
        return;
      }

      const updateStmt = db.prepare('UPDATE system_settings SET value = ?, updated_at = datetime(\'now\') WHERE key = ?');
      const updateTx = db.transaction(() => {
        for (const s of settings) {
          updateStmt.run(s.value.toString(), s.key);
        }
      });

      updateTx();

      AuditService.log({
        userId: req.user!.userId,
        username: req.user!.username,
        action: 'SYSTEM_SETTINGS_UPDATED',
        resourceType: 'SYSTEM',
        details: { count: settings.length }
      });

      res.json({ message: 'Settings updated successfully' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}
