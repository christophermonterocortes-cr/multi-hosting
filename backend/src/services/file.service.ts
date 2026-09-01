import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { config } from '../config/env';

export interface FileItem {
  name: string;
  relativePath: string;
  isDirectory: boolean;
  size: number;
  extension: string;
  modifiedAt: string;
}

export class FileService {
  /**
   * Get the absolute project root directory on the host filesystem
   */
  public static getProjectRoot(projectId: string): string {
    const projectDir = path.resolve(config.projectsDir, projectId);
    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true });
    }
    return projectDir;
  }

  /**
   * Safely resolve a path within the project root, preventing directory traversal / Zip Slip
   */
  public static resolveSafePath(projectId: string, userSubPath = ''): string {
    const root = this.getProjectRoot(projectId);
    // Normalize and sanitize input
    const sanitized = userSubPath.replace(/\\/g, '/').replace(/^\/+/, '');
    const resolved = path.resolve(root, sanitized);

    // Verify the resolved path is strictly inside the project root
    const relative = path.relative(root, resolved);
    if (relative.startsWith('..') || path.isAbsolute(relative) || relative.includes('\0')) {
      throw new Error(`Security Violation: Path traversal attempt detected: ${userSubPath}`);
    }

    return resolved;
  }

  /**
   * List files and directories within a given project subpath
   */
  public static async listFiles(projectId: string, subPath = ''): Promise<FileItem[]> {
    const targetDir = this.resolveSafePath(projectId, subPath);
    if (!fs.existsSync(targetDir)) {
      return [];
    }

    const entries = await fs.promises.readdir(targetDir, { withFileTypes: true });
    const root = this.getProjectRoot(projectId);

    const results: FileItem[] = [];
    for (const entry of entries) {
      const fullPath = path.join(targetDir, entry.name);
      const relPath = path.relative(root, fullPath).replace(/\\/g, '/');
      const stats = await fs.promises.stat(fullPath).catch(() => null);

      results.push({
        name: entry.name,
        relativePath: relPath,
        isDirectory: entry.isDirectory(),
        size: stats ? stats.size : 0,
        extension: entry.isDirectory() ? '' : path.extname(entry.name).toLowerCase().replace(/^\./, ''),
        modifiedAt: stats ? stats.mtime.toISOString() : new Date().toISOString()
      });
    }

    // Sort directories first, then alphabetically
    return results.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Read the text/utf-8 content of a file
   */
  public static async readFile(projectId: string, relativePath: string): Promise<string> {
    const filePath = this.resolveSafePath(projectId, relativePath);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${relativePath}`);
    }
    const stat = await fs.promises.stat(filePath);
    if (stat.isDirectory()) {
      throw new Error(`Path is a directory, not a file: ${relativePath}`);
    }
    if (stat.size > 5 * 1024 * 1024) {
      throw new Error(`File is too large to open in browser editor (>5MB): ${relativePath}`);
    }
    return fs.promises.readFile(filePath, 'utf8');
  }

  /**
   * Write text content to a file safely
   */
  public static async writeFile(projectId: string, relativePath: string, content: string): Promise<void> {
    const filePath = this.resolveSafePath(projectId, relativePath);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await fs.promises.writeFile(filePath, content, 'utf8');
  }

  /**
   * Create a directory
   */
  public static async createDirectory(projectId: string, relativePath: string): Promise<void> {
    const dirPath = this.resolveSafePath(projectId, relativePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Delete a file or directory
   */
  public static async deletePath(projectId: string, relativePath: string): Promise<void> {
    const targetPath = this.resolveSafePath(projectId, relativePath);
    const root = this.getProjectRoot(projectId);
    
    // Prevent deleting the root itself
    if (targetPath === root) {
      throw new Error('Cannot delete project root folder');
    }

    if (fs.existsSync(targetPath)) {
      await fs.promises.rm(targetPath, { recursive: true, force: true });
    }
  }

  /**
   * Rename or move a file/directory within project root
   */
  public static async renamePath(projectId: string, oldRelative: string, newRelative: string): Promise<void> {
    const oldPath = this.resolveSafePath(projectId, oldRelative);
    const newPath = this.resolveSafePath(projectId, newRelative);

    if (!fs.existsSync(oldPath)) {
      throw new Error(`Source file does not exist: ${oldRelative}`);
    }

    const newDir = path.dirname(newPath);
    if (!fs.existsSync(newDir)) {
      fs.mkdirSync(newDir, { recursive: true });
    }

    await fs.promises.rename(oldPath, newPath);
  }

  /**
   * Extract a ZIP file safely with strict Anti-Zip-Slip validation
   */
  public static async extractZipArchive(projectId: string, zipFilePath: string, targetSubPath = ''): Promise<{ extractedCount: number }> {
    const targetDir = this.resolveSafePath(projectId, targetSubPath);
    const root = this.getProjectRoot(projectId);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const zip = new AdmZip(zipFilePath);
    const zipEntries = zip.getEntries();
    let extractedCount = 0;

    for (const entry of zipEntries) {
      const rawName = entry.entryName;
      const entryName = rawName.replace(/\\/g, '/');

      // Reject path traversal characters in entry name
      if (entryName.includes('..') || entryName.startsWith('/') || entryName.includes('\0')) {
        throw new Error(`Malicious ZIP detected: file path '${entryName}' attempts directory traversal outside project root.`);
      }

      const targetDestination = path.resolve(targetDir, entryName);
      
      // Strict Anti-Zip-Slip check
      const relative = path.relative(root, targetDestination);
      if (relative.startsWith('..') || path.isAbsolute(relative) || relative.includes('\0')) {
        throw new Error(`Malicious ZIP detected: file path '${entryName}' attempts directory traversal outside project root.`);
      }

      if (entry.isDirectory) {
        if (!fs.existsSync(targetDestination)) {
          fs.mkdirSync(targetDestination, { recursive: true });
        }
      } else {
        const parentDir = path.dirname(targetDestination);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }
        await fs.promises.writeFile(targetDestination, entry.getData());
        extractedCount++;
      }
    }

    return { extractedCount };
  }

  /**
   * Initialize starter project files based on runtime type or chosen template
   */
  public static async initStarterFiles(projectId: string, runtimeType: 'STATIC' | 'PHP', templateKey?: string): Promise<void> {
    const root = this.getProjectRoot(projectId);

    if (templateKey) {
      const templatePath = path.resolve(config.templatesDir, templateKey);
      if (fs.existsSync(templatePath)) {
        await this.copyRecursive(templatePath, root);
        return;
      }
    }

    // Default starter file
    if (runtimeType === 'STATIC') {
      const staticStarter = path.resolve(config.runtimesDir, 'static', 'default-index.html');
      if (fs.existsSync(staticStarter)) {
        const content = fs.readFileSync(staticStarter, 'utf8');
        fs.writeFileSync(path.join(root, 'index.html'), content, 'utf8');
      }
    } else {
      const phpStarter = path.resolve(config.runtimesDir, 'php', 'default-index.php');
      if (fs.existsSync(phpStarter)) {
        const content = fs.readFileSync(phpStarter, 'utf8');
        fs.writeFileSync(path.join(root, 'index.php'), content, 'utf8');
      }
    }
  }

  /**
   * Delete the entire project directory tree
   */
  public static async deleteProjectDirectory(projectId: string): Promise<void> {
    const root = path.resolve(config.projectsDir, projectId);
    if (fs.existsSync(root)) {
      await fs.promises.rm(root, { recursive: true, force: true });
    }
  }

  /**
   * Synchronously or asynchronously calculate directory size
   */
  public static getDirectorySize(dirPath: string): number {
    let total = 0;
    if (!fs.existsSync(dirPath)) return 0;
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          total += this.getDirectorySize(fullPath);
        } else {
          try {
            const stat = fs.statSync(fullPath);
            total += stat.size;
          } catch {}
        }
      }
    } catch {}
    return total;
  }

  /**
   * Calculate total disk usage of project files
   */
  public static async getStorageUsage(projectId: string): Promise<number> {
    const root = this.getProjectRoot(projectId);
    return this.calculateDirSize(root);
  }

  private static async calculateDirSize(dirPath: string): Promise<number> {
    let total = 0;
    if (!fs.existsSync(dirPath)) return 0;
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        total += await this.calculateDirSize(fullPath);
      } else {
        const stat = await fs.promises.stat(fullPath).catch(() => null);
        if (stat) total += stat.size;
      }
    }
    return total;
  }

  private static async copyRecursive(src: string, dest: string): Promise<void> {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = await fs.promises.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        await this.copyRecursive(srcPath, destPath);
      } else {
        await fs.promises.copyFile(srcPath, destPath);
      }
    }
  }
}
