import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { AuditService } from '../services/audit.service';

export class AuditController {
  /**
   * Get paginated audit logs (Admin only)
   */
  public static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 100);
      const offset = parseInt((req.query.offset as string) || '0', 10);
      const filter = (req.query.filter as string) || undefined;

      const result = AuditService.getLogs(limit, offset, filter);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
