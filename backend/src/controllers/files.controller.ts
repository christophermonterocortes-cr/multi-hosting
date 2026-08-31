import { Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { db } from '../config/database';
import { FileService } from '../services/file.service';
import { AuditService } from '../services/audit.service';

const upload = multer({
  dest: path.join(process.cwd(), '../data/tmp'),
  limits: { fileSize: 500 * 1024 * 1024 } // 500 MB max
});

export const uploadMiddleware = upload.array('files', 2000);
export const uploadSingleZipMiddleware = upload.single('zipFile');

export class FilesController {
  public static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const subPath = (req.query.path as string) || '';
      await FilesController.assertProjectAccess(id, req.user!);

      const files = await FileService.listFiles(id, subPath);
      res.json({ files, currentPath: subPath });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  public static async getContent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const filePath = (req.query.path as string) || '';
      if (!filePath) {
        res.status(400).json({ error: 'File path is required' });
        return;
      }
      await FilesController.assertProjectAccess(id, req.user!);

      const safePath = FileService.resolveSafePath(id, filePath);
      const stat = await fs.promises.stat(safePath);
      if (stat.size > 5 * 1024 * 1024) {
        res.status(400).json({ error: 'File is too large to view/edit in the web editor (limit: 5MB).' });
        return;
      }

      const content = await FileService.readFile(id, filePath);
      res.json({ content, path: filePath });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  public static async saveContent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { path: filePath, content } = req.body;
      if (!filePath || content === undefined) {
        res.status(400).json({ error: 'File path and content are required' });
        return;
      }
      await FilesController.assertProjectAccess(id, req.user!);

      await FileService.writeFile(id, filePath, content);
      
      AuditService.log({
        userId: req.user!.userId,
        username: req.user!.username,
        action: 'FILE_EDITED',
        resourceType: 'PROJECT_FILE',
        resourceId: id,
        details: { path: filePath }
      });

      res.json({ message: 'File saved successfully' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  public static async uploadFiles(req: AuthenticatedRequest, res: Response): Promise<void> {
    const files = (req.files as Express.Multer.File[]) || [];
    try {
      const id = String(req.params.id);
      const targetSubPath = (req.body.targetPath as string) || '';
      await FilesController.assertProjectAccess(id, req.user!);

      if (files.length === 0) {
        res.status(400).json({ error: 'No files uploaded' });
        return;
      }

      // Handle relative paths sent by drag & drop or folder upload (e.g. ["css/style.css", "js/app.js"])
      let relativePaths: string[] = [];
      if (req.body.relativePaths) {
        try {
          relativePaths = typeof req.body.relativePaths === 'string'
            ? JSON.parse(req.body.relativePaths)
            : req.body.relativePaths;
        } catch {
          relativePaths = Array.isArray(req.body.relativePaths) ? req.body.relativePaths : [req.body.relativePaths];
        }
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const rel = (relativePaths && relativePaths[i]) ? relativePaths[i] : file.originalname;
        const cleanRel = rel.replace(/\\/g, '/').replace(/^\/+/, '');
        const destRelative = path.join(targetSubPath, cleanRel);
        const destAbsolute = FileService.resolveSafePath(id, destRelative);
        
        const parentDir = path.dirname(destAbsolute);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }

        await fs.promises.copyFile(file.path, destAbsolute);
        await fs.promises.unlink(file.path).catch(() => {});
      }

      AuditService.log({
        userId: req.user!.userId,
        username: req.user!.username,
        action: 'FILES_UPLOADED',
        resourceType: 'PROJECT_FILE',
        resourceId: id,
        details: { fileCount: files.length, targetPath: targetSubPath }
      });

      res.json({ message: `Successfully uploaded ${files.length} item(s)` });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    } finally {
      // Guarantee cleanup of any remaining temp files
      for (const file of files) {
        if (file?.path && fs.existsSync(file.path)) {
          await fs.promises.unlink(file.path).catch(() => {});
        }
      }
    }
  }

  public static async uploadZip(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const targetSubPath = (req.body.targetPath as string) || '';
      await FilesController.assertProjectAccess(id, req.user!);

      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'No ZIP archive uploaded' });
        return;
      }

      try {
        const { extractedCount } = await FileService.extractZipArchive(id, file.path, targetSubPath);
        
        AuditService.log({
          userId: req.user!.userId,
          username: req.user!.username,
          action: 'ZIP_EXTRACTED',
          resourceType: 'PROJECT_FILE',
          resourceId: id,
          details: { filename: file.originalname, extractedCount }
        });

        res.json({ message: `Successfully extracted ${extractedCount} items from ZIP.` });
      } finally {
        await fs.promises.unlink(file.path).catch(() => {});
      }
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  public static async createDirectory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { path: dirPath } = req.body;
      if (!dirPath) {
        res.status(400).json({ error: 'Directory path is required' });
        return;
      }
      await FilesController.assertProjectAccess(id, req.user!);

      await FileService.createDirectory(id, dirPath);
      res.json({ message: 'Directory created successfully' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  public static async rename(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { oldPath, newPath } = req.body;
      if (!oldPath || !newPath) {
        res.status(400).json({ error: 'Both oldPath and newPath are required' });
        return;
      }
      await FilesController.assertProjectAccess(id, req.user!);

      await FileService.renamePath(id, oldPath, newPath);
      res.json({ message: 'File renamed successfully' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  public static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const targetPath = (req.query.path as string) || '';
      if (!targetPath) {
        res.status(400).json({ error: 'Target path is required' });
        return;
      }
      await FilesController.assertProjectAccess(id, req.user!);

      await FileService.deletePath(id, targetPath);

      AuditService.log({
        userId: req.user!.userId,
        username: req.user!.username,
        action: 'FILE_DELETED',
        resourceType: 'PROJECT_FILE',
        resourceId: id,
        details: { path: targetPath }
      });

      res.json({ message: 'Item deleted successfully' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  private static async assertProjectAccess(projectId: string, user: { userId: string; role: string }): Promise<void> {
    const project = db.prepare('SELECT owner_id, status FROM projects WHERE id = ?').get(projectId) as any;
    if (!project || project.status === 'DELETED') {
      throw new Error('Project not found');
    }
    if (user.role !== 'ADMIN' && project.owner_id !== user.userId) {
      throw new Error('Access denied: You do not own this project');
    }
  }
}
