import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import fs from 'fs';

import { openApiSpec } from './docs/openapi';
import { globalLimiter, authLimiter } from './middleware/rateLimit.middleware';
import { authenticate, requireAdmin } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.middleware';

import { AuthController } from './controllers/auth.controller';
import { ProjectsController } from './controllers/projects.controller';
import { FilesController, uploadMiddleware, uploadSingleZipMiddleware } from './controllers/files.controller';
import { DatabasesController } from './controllers/databases.controller';
import { PortsController } from './controllers/ports.controller';
import { UsersController } from './controllers/users.controller';
import { SystemController } from './controllers/system.controller';
import { AuditController } from './controllers/audit.controller';

const app = express();

app.set('trust proxy', 1);

// Security Headers & Middlewares
app.use(helmet({
  contentSecurityPolicy: false // Allow inline scripts for Swagger and SPA
}));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(morgan('dev'));
app.use(globalLimiter);

// OpenAPI / Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.get('/api/openapi.json', (req, res) => res.json(openApiSpec));

// Base Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), platform: 'Multi Hosting' });
});

// Authentication Routes
app.post('/api/auth/register', authLimiter, AuthController.register);
app.post('/api/auth/login', authLimiter, AuthController.login);
app.get('/api/auth/me', authenticate, AuthController.getMe);

// Project Management Routes
app.get('/api/projects', authenticate, ProjectsController.list);
app.post('/api/projects', authenticate, ProjectsController.create);
app.get('/api/projects/:id', authenticate, ProjectsController.getById);
app.put('/api/projects/:id', authenticate, ProjectsController.update);
app.post('/api/projects/:id/start', authenticate, ProjectsController.start);
app.post('/api/projects/:id/stop', authenticate, ProjectsController.stop);
app.post('/api/projects/:id/restart', authenticate, ProjectsController.restart);
app.delete('/api/projects/:id', authenticate, ProjectsController.delete);
app.get('/api/projects/:id/stats', authenticate, ProjectsController.getStats);
app.get('/api/projects/:id/logs', authenticate, ProjectsController.getLogs);

// File Manager Routes
app.get('/api/projects/:id/files', authenticate, FilesController.list);
app.get('/api/projects/:id/files/content', authenticate, FilesController.getContent);
app.put('/api/projects/:id/files/content', authenticate, FilesController.saveContent);
app.post('/api/projects/:id/files/upload', authenticate, uploadMiddleware, FilesController.uploadFiles);
app.post('/api/projects/:id/files/upload-zip', authenticate, uploadSingleZipMiddleware, FilesController.uploadZip);
app.post('/api/projects/:id/files/mkdir', authenticate, FilesController.createDirectory);
app.post('/api/projects/:id/files/rename', authenticate, FilesController.rename);
app.delete('/api/projects/:id/files', authenticate, FilesController.delete);

// Database Provisioning Routes
app.get('/api/databases', authenticate, DatabasesController.listAll);
app.post('/api/projects/:id/database', authenticate, DatabasesController.provision);
app.get('/api/projects/:id/database', authenticate, DatabasesController.getCredentials);
app.post('/api/projects/:id/database/regenerate-password', authenticate, DatabasesController.regeneratePassword);
app.delete('/api/projects/:id/database', authenticate, DatabasesController.delete);

// Port Management Routes
app.get('/api/ports', authenticate, PortsController.getMatrix);
app.post('/api/ports/reconcile', authenticate, requireAdmin, PortsController.reconcile);

// User Management Routes (Admin Only)
app.get('/api/users', authenticate, requireAdmin, UsersController.list);
app.post('/api/users', authenticate, requireAdmin, UsersController.create);
app.put('/api/users/:id', authenticate, requireAdmin, UsersController.update);
app.delete('/api/users/:id', authenticate, requireAdmin, UsersController.delete);

// System Health & Settings
app.get('/api/system/health', authenticate, SystemController.getHealth);
app.get('/api/system/settings', authenticate, requireAdmin, SystemController.getSettings);
app.put('/api/system/settings', authenticate, requireAdmin, SystemController.updateSettings);

// Audit Logs (Admin Only)
app.get('/api/audit-logs', authenticate, requireAdmin, AuditController.list);

// Serve Frontend Build in Production if present
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Error Handling Middleware
app.use(errorHandler);

export default app;
