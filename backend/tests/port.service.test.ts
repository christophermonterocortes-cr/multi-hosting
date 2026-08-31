import { PortService } from '../src/services/port.service';
import { db, initDatabase } from '../src/config/database';
import { DockerService } from '../src/services/docker.service';
import net from 'net';

describe('PortService Tests', () => {
  const userId = 'test-user-port';

  beforeAll(() => {
    initDatabase();
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    db.prepare(`
      INSERT INTO users (id, email, username, password_hash, role, is_active, created_at, updated_at)
      VALUES (?, 'portuser@example.com', 'portuser', 'hash', 'USER', 1, datetime('now'), datetime('now'))
    `).run(userId);
  });

  beforeEach(() => {
    jest.spyOn(DockerService, 'getAllPublishedHostPorts').mockResolvedValue(new Set<number>());
    db.prepare('DELETE FROM assigned_ports').run();
    db.prepare('DELETE FROM projects').run();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createDummyProject = (projId: string) => {
    db.prepare(`
      INSERT INTO projects (id, name, slug, owner_id, runtime_type, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'STATIC', 'PROVISIONING', datetime('now'), datetime('now'))
    `).run(projId, `Project ${projId}`, `slug-${projId}`, userId);
  };

  it('should allocate the starting port 16000 for the first project', async () => {
    createDummyProject('test-proj-1');
    const port = await PortService.allocatePort('test-proj-1');
    expect(port).toBe(16000);

    const record = db.prepare('SELECT * FROM assigned_ports WHERE port = ?').get(16000) as any;
    expect(record).toBeDefined();
    expect(record.project_id).toBe('test-proj-1');
    expect(record.status).toBe('ALLOCATED');
  });

  it('should allocate consecutive ports for multiple projects', async () => {
    createDummyProject('test-proj-1');
    createDummyProject('test-proj-2');
    createDummyProject('test-proj-3');

    const port1 = await PortService.allocatePort('test-proj-1');
    const port2 = await PortService.allocatePort('test-proj-2');
    const port3 = await PortService.allocatePort('test-proj-3');

    expect(port1).toBe(16000);
    expect(port2).toBe(16001);
    expect(port3).toBe(16002);
  });

  it('should handle simultaneous concurrent allocations without assigning duplicate ports', async () => {
    for (let i = 1; i <= 5; i++) {
      createDummyProject(`parallel-${i}`);
    }

    const promises = [
      PortService.allocatePort('parallel-1'),
      PortService.allocatePort('parallel-2'),
      PortService.allocatePort('parallel-3'),
      PortService.allocatePort('parallel-4'),
      PortService.allocatePort('parallel-5')
    ];

    const results = await Promise.all(promises);
    const uniquePorts = new Set(results);

    expect(uniquePorts.size).toBe(5);
    expect(results).toEqual(expect.arrayContaining([16000, 16001, 16002, 16003, 16004]));
  });

  it('should release an assigned port and allow it to be reallocated', async () => {
    createDummyProject('test-proj-1');
    const port1 = await PortService.allocatePort('test-proj-1');
    expect(port1).toBe(16000);

    await PortService.releasePort(port1, 'test-proj-1');

    const record = db.prepare('SELECT * FROM assigned_ports WHERE port = ?').get(16000) as any;
    expect(record.status).toBe('RELEASED');

    createDummyProject('test-proj-new');
    const portReallocated = await PortService.allocatePort('test-proj-new');
    expect(portReallocated).toBe(16000);
  });

  it('should skip a port if it is occupied by an active host process', async () => {
    createDummyProject('test-proj-occupied-check');
    const dummyServer = net.createServer();
    await new Promise<void>((resolve) => {
      dummyServer.listen(16000, '0.0.0.0', () => resolve());
    });

    try {
      const port = await PortService.allocatePort('test-proj-occupied-check');
      expect(port).toBe(16001);
    } finally {
      await new Promise<void>((resolve) => dummyServer.close(() => resolve()));
    }
  });

  it('should skip a port if it is in use by an external Docker container', async () => {
    jest.spyOn(DockerService, 'getAllPublishedHostPorts').mockResolvedValue(new Set<number>([16000, 16001]));
    createDummyProject('test-proj-docker-check');

    const port = await PortService.allocatePort('test-proj-docker-check');
    expect(port).toBe(16002);
  });
});
