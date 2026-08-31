import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { PortService } from '../services/port.service';
import { AuditService } from '../services/audit.service';

export class PortsController {
  /**
   * Get complete status grid of ports (Free, In Use, Reserved)
   */
  public static async getMatrix(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const limit = parseInt((req.query.limit as string) || '200', 10);
      const matrix = await PortService.getPortMatrix(limit);
      res.json(matrix);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Admin trigger to reconcile orphaned port allocations
   */
  public static async reconcile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await PortService.reconcilePorts();

      AuditService.log({
        userId: req.user!.userId,
        username: req.user!.username,
        action: 'PORTS_RECONCILED',
        resourceType: 'SYSTEM',
        details: result
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
