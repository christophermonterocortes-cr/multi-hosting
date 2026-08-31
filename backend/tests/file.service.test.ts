import { FileService } from '../src/services/file.service';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

describe('FileService & Security Tests', () => {
  const testProjectId = 'test-security-proj';

  beforeAll(async () => {
    const root = FileService.getProjectRoot(testProjectId);
    if (fs.existsSync(root)) {
      await fs.promises.rm(root, { recursive: true, force: true });
    }
  });

  afterAll(async () => {
    const root = FileService.getProjectRoot(testProjectId);
    if (fs.existsSync(root)) {
      await fs.promises.rm(root, { recursive: true, force: true });
    }
  });

  it('should write, read, list, and delete files safely within project directory', async () => {
    await FileService.writeFile(testProjectId, 'index.html', '<h1>Hello World</h1>');
    await FileService.writeFile(testProjectId, 'css/style.css', 'body { color: red; }');

    const content = await FileService.readFile(testProjectId, 'index.html');
    expect(content).toBe('<h1>Hello World</h1>');

    const files = await FileService.listFiles(testProjectId);
    expect(files.some(f => f.name === 'index.html' && !f.isDirectory)).toBe(true);
    expect(files.some(f => f.name === 'css' && f.isDirectory)).toBe(true);

    await FileService.deletePath(testProjectId, 'index.html');
    const filesAfter = await FileService.listFiles(testProjectId);
    expect(filesAfter.some(f => f.name === 'index.html')).toBe(false);
  });

  it('should prevent path traversal attempts using .. or relative paths', () => {
    expect(() => {
      FileService.resolveSafePath(testProjectId, '../../etc/passwd');
    }).toThrow(/Path traversal attempt detected/);

    expect(() => {
      FileService.resolveSafePath(testProjectId, '/../../../root/.ssh/id_rsa');
    }).toThrow(/Path traversal attempt detected/);

    expect(() => {
      FileService.resolveSafePath(testProjectId, 'public/../../../../secret.txt');
    }).toThrow(/Path traversal attempt detected/);
  });

  it('should block Zip Slip attacks when extracting malicious ZIP archives', async () => {
    const tmpZipPath = path.join(FileService.getProjectRoot(testProjectId), 'malicious.zip');

    // Create an authentic zip archive with path traversal entry
    execSync(`python3 -c "import zipfile; z = zipfile.ZipFile('${tmpZipPath}', 'w'); z.writestr('../../etc/cron.d/malicious.txt', 'evil payload'); z.writestr('safe.txt', 'safe payload')"`);

    await expect(
      FileService.extractZipArchive(testProjectId, tmpZipPath)
    ).rejects.toThrow(/Malicious ZIP detected/);

    // Verify malicious file was NOT written outside project directory
    const outsidePath = path.resolve(FileService.getProjectRoot(testProjectId), '../../etc/cron.d/malicious.txt');
    expect(fs.existsSync(outsidePath)).toBe(false);

    await fs.promises.unlink(tmpZipPath).catch(() => {});
  });
});
