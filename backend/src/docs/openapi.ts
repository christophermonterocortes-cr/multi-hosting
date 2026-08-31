export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Multi Hosting Control Panel API',
    version: '1.0.0',
    description: 'Production-ready REST API for provisioning and managing isolated static/PHP web applications, databases, host port allocations, and file storage on the Multi Hosting platform.'
  },
  servers: [
    {
      url: '/api',
      description: 'Primary API Server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide JWT token in Authorization header as `Bearer <token>`'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          username: { type: 'string' },
          role: { type: 'string', enum: ['ADMIN', 'USER'] },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string' }
        }
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          slug: { type: 'string' },
          runtimeType: { type: 'string', enum: ['STATIC', 'PHP'] },
          port: { type: 'integer' },
          url: { type: 'string' },
          status: { type: 'string', enum: ['PROVISIONING', 'RUNNING', 'STOPPED', 'SUSPENDED', 'FAILED', 'DELETED'] },
          domain: { type: 'string', nullable: true },
          documentRoot: { type: 'string' },
          hasDatabase: { type: 'boolean' },
          databaseEngine: { type: 'string', nullable: true },
          createdAt: { type: 'string' },
          updatedAt: { type: 'string' }
        }
      },
      DatabaseCredentials: {
        type: 'object',
        properties: {
          engine: { type: 'string', enum: ['POSTGRESQL', 'MYSQL'] },
          host: { type: 'string' },
          port: { type: 'integer' },
          dbName: { type: 'string' },
          dbUser: { type: 'string' },
          password: { type: 'string' },
          connectionUri: { type: 'string' },
          cliExample: { type: 'string' },
          pdoExample: { type: 'string' },
          envConfig: { type: 'string' },
          status: { type: 'string' }
        }
      }
    }
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user account',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'username', 'password'],
                properties: {
                  email: { type: 'string' },
                  username: { type: 'string' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'User registered' },
          400: { description: 'Validation error' }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Log in with username or email',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['identifier', 'password'],
                properties: {
                  identifier: { type: 'string' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Authenticated successfully' },
          401: { description: 'Invalid credentials or account locked' }
        }
      }
    },
    '/auth/me': {
      get: {
        summary: 'Get current user profile',
        security: [{ BearerAuth: [] }],
        tags: ['Authentication'],
        responses: {
          200: { description: 'User profile retrieved' }
        }
      }
    },
    '/projects': {
      get: {
        summary: 'List user or all projects',
        security: [{ BearerAuth: [] }],
        tags: ['Projects'],
        responses: {
          200: { description: 'List of projects' }
        }
      },
      post: {
        summary: 'Provision a new website project',
        security: [{ BearerAuth: [] }],
        tags: ['Projects'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'runtimeType'],
                properties: {
                  name: { type: 'string' },
                  runtimeType: { type: 'string', enum: ['STATIC', 'PHP'] },
                  template: { type: 'string' },
                  createDatabase: { type: 'boolean' },
                  databaseEngine: { type: 'string', enum: ['POSTGRESQL', 'MYSQL'] },
                  documentRoot: { type: 'string' },
                  domain: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Project provisioned' }
        }
      }
    },
    '/projects/{id}': {
      get: {
        summary: 'Get project details by ID',
        security: [{ BearerAuth: [] }],
        tags: ['Projects'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Project details' } }
      },
      delete: {
        summary: 'Delete project and release all resources',
        security: [{ BearerAuth: [] }],
        tags: ['Projects'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Project deleted' } }
      }
    },
    '/projects/{id}/start': {
      post: {
        summary: 'Start project container',
        security: [{ BearerAuth: [] }],
        tags: ['Container Lifecycle'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Started' } }
      }
    },
    '/projects/{id}/stop': {
      post: {
        summary: 'Stop project container',
        security: [{ BearerAuth: [] }],
        tags: ['Container Lifecycle'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Stopped' } }
      }
    },
    '/projects/{id}/restart': {
      post: {
        summary: 'Restart project container',
        security: [{ BearerAuth: [] }],
        tags: ['Container Lifecycle'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Restarted' } }
      }
    },
    '/projects/{id}/stats': {
      get: {
        summary: 'Get live CPU/RAM and storage stats',
        security: [{ BearerAuth: [] }],
        tags: ['Monitoring'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Stats returned' } }
      }
    },
    '/projects/{id}/logs': {
      get: {
        summary: 'Get live container stdout/stderr logs',
        security: [{ BearerAuth: [] }],
        tags: ['Monitoring'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Logs retrieved' } }
      }
    },
    '/projects/{id}/database': {
      post: {
        summary: 'Provision dedicated PostgreSQL or MariaDB database',
        security: [{ BearerAuth: [] }],
        tags: ['Database'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { engine: { type: 'string', enum: ['POSTGRESQL', 'MYSQL'] } }
              }
            }
          }
        },
        responses: { 201: { description: 'Database provisioned' } }
      },
      get: {
        summary: 'Get database connection information and code snippets',
        security: [{ BearerAuth: [] }],
        tags: ['Database'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'revealPassword', in: 'query', schema: { type: 'boolean' } }
        ],
        responses: { 200: { description: 'Database credentials' } }
      },
      delete: {
        summary: 'Delete project database',
        security: [{ BearerAuth: [] }],
        tags: ['Database'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Database deleted' } }
      }
    },
    '/projects/{id}/database/regenerate-password': {
      post: {
        summary: 'Regenerate secure database password',
        security: [{ BearerAuth: [] }],
        tags: ['Database'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Password regenerated' } }
      }
    },
    '/ports': {
      get: {
        summary: 'Get port matrix with allocation status',
        security: [{ BearerAuth: [] }],
        tags: ['Port Management'],
        responses: { 200: { description: 'Port matrix' } }
      }
    },
    '/system/health': {
      get: {
        summary: 'Get host system health and metrics (CPU, RAM, Disk, Docker, DB)',
        security: [{ BearerAuth: [] }],
        tags: ['System'],
        responses: { 200: { description: 'Health metrics' } }
      }
    },
    '/audit-logs': {
      get: {
        summary: 'Get audit logs (Admin only)',
        security: [{ BearerAuth: [] }],
        tags: ['Audit'],
        responses: { 200: { description: 'Audit logs' } }
      }
    }
  }
};
