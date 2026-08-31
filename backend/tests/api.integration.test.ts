import request from 'supertest';
import app from '../src/app';
import { db, initDatabase } from '../src/config/database';
import { AuthService } from '../src/services/auth.service';

describe('Multi Hosting End-to-End REST API Tests', () => {
  let adminToken: string;
  let userToken: string;
  let userId: string;
  let createdProjectId: string;

  beforeAll(async () => {
    initDatabase();
    await AuthService.seedDefaultAdmin();

    // Login as Admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'admin', password: 'AdminPass123!Secure' });
    adminToken = adminLogin.body.token;

    // Register & Login as regular user
    const testUsername = `e2e_user_${Date.now()}`;
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ email: `${testUsername}@example.com`, username: testUsername, password: 'UserPass123!' });
    userToken = regRes.body.token;
    userId = regRes.body.user.id;
  });

  it('GET /api/health - should return status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.platform).toBe('Multi Hosting');
  });

  it('POST /api/projects - should provision a static website with allocated port', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'My Static Portfolio',
        runtimeType: 'STATIC',
        createDatabase: true,
        databaseEngine: 'POSTGRESQL'
      });

    expect(res.status).toBe(201);
    expect(res.body.project).toBeDefined();
    expect(res.body.project.port).toBeGreaterThanOrEqual(16000);
    expect(res.body.project.url).toContain(res.body.project.port.toString());
    expect(res.body.project.hasDatabase).toBe(true);

    createdProjectId = res.body.project.id;
  }, 15000);

  it('GET /api/projects/:id - should retrieve project details for owner', async () => {
    const res = await request(app)
      .get(`/api/projects/${createdProjectId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.project.id).toBe(createdProjectId);
    expect(res.body.project.name).toBe('My Static Portfolio');
  });

  it('PUT /api/projects/:id - should update project name and domain', async () => {
    const res = await request(app)
      .put(`/api/projects/${createdProjectId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'My Renamed Portfolio',
        domain: 'portfolio.example.com'
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('updated successfully');

    const check = await request(app)
      .get(`/api/projects/${createdProjectId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(check.body.project.name).toBe('My Renamed Portfolio');
    expect(check.body.project.domain).toBe('portfolio.example.com');
  });

  it('GET /api/projects/:id/database - should return database credentials with revealed password', async () => {
    const res = await request(app)
      .get(`/api/projects/${createdProjectId}/database?revealPassword=true`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.database).toBeDefined();
    expect(res.body.database.engine).toBe('POSTGRESQL');
    expect(res.body.database.password).toBeDefined();
    expect(res.body.database.connectionUri).toContain('postgresql://');
  });

  it('GET /api/ports - should show allocated port in matrix', async () => {
    const res = await request(app)
      .get('/api/ports')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.ports).toBeDefined();
    expect(res.body.allocatedCount).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/system/health - should return host system metrics', async () => {
    const res = await request(app)
      .get('/api/system/health')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.cpu).toBeDefined();
    expect(res.body.memory).toBeDefined();
    expect(res.body.disk).toBeDefined();
    expect(res.body.controlPlaneDb.connected).toBe(true);
  });

  it('Security: Regular user cannot access admin-only endpoints', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Administrator privileges required');
  });

  it('DELETE /api/projects/:id - should delete project and release port', async () => {
    const res = await request(app)
      .delete(`/api/projects/${createdProjectId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('released');

    const check = await request(app)
      .get(`/api/projects/${createdProjectId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(check.status).toBe(404);
  });
});
