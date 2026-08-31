import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const ROOT_DATA_DIR = process.env.DATA_DIR || path.resolve(process.cwd(), '../data');

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  host: process.env.HOST || '0.0.0.0',
  serverIp: process.env.SERVER_IP || '127.0.0.1',
  
  // JWT & Security
  jwtSecret: process.env.JWT_SECRET || 'multi_hosting_super_secret_jwt_key_32bytes_min!',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  encryptionKey: process.env.ENCRYPTION_KEY || 'multi_hosting_aes_256_encryption_key_32_bytes!',
  
  // Storage Paths (Container internal)
  dataDir: ROOT_DATA_DIR,
  projectsDir: path.join(ROOT_DATA_DIR, 'projects'),
  backupsDir: path.join(ROOT_DATA_DIR, 'backups'),
  databaseFile: process.env.DB_FILE || path.join(ROOT_DATA_DIR, 'db', 'multi_hosting.sqlite'),
  templatesDir: path.resolve(__dirname, '../../sample-templates'),
  runtimesDir: path.resolve(__dirname, '../../runtimes'),

  // Storage Paths on Host (for Docker-out-of-Docker sibling mounts)
  hostDataDir: process.env.HOST_DATA_DIR || ROOT_DATA_DIR,
  hostRuntimesDir: process.env.HOST_RUNTIMES_DIR || path.resolve(__dirname, '../../runtimes'),

  // Port Management
  portRangeStart: parseInt(process.env.PORT_RANGE_START || '16000', 10),
  portRangeEnd: parseInt(process.env.PORT_RANGE_END || '20000', 10),

  // Docker / Podman Engine Socket
  dockerSocketPath: process.env.DOCKER_SOCKET || (
    process.env.XDG_RUNTIME_DIR 
      ? `${process.env.XDG_RUNTIME_DIR}/podman/podman.sock`
      : '/var/run/docker.sock'
  ),

  // Managed Database Server Defaults
  postgresHost: process.env.MANAGED_POSTGRES_HOST || '127.0.0.1',
  postgresPort: parseInt(process.env.MANAGED_POSTGRES_PORT || '5432', 10),
  postgresAdminUser: process.env.MANAGED_POSTGRES_ADMIN_USER || 'postgres',
  postgresAdminPassword: process.env.MANAGED_POSTGRES_ADMIN_PASSWORD || 'postgres_admin_pass_multi_hosting',

  mysqlHost: process.env.MANAGED_MYSQL_HOST || '127.0.0.1',
  mysqlPort: parseInt(process.env.MANAGED_MYSQL_PORT || '3306', 10),
  mysqlAdminUser: process.env.MANAGED_MYSQL_ADMIN_USER || 'root',
  mysqlAdminPassword: process.env.MANAGED_MYSQL_ADMIN_PASSWORD || 'mysql_admin_pass_multi_hosting',

  // Rate Limiting & Account Security
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  rateLimitMaxRequests: 200,
  authMaxAttempts: 5,
  authLockoutDurationMs: 15 * 60 * 1000, // 15 minutes

  // Default Admin Seed
  defaultAdminEmail: process.env.DEFAULT_ADMIN_EMAIL || 'admin@multihosting.local',
  defaultAdminUsername: process.env.DEFAULT_ADMIN_USERNAME || 'admin',
  defaultAdminPassword: process.env.DEFAULT_ADMIN_PASSWORD || 'AdminPass123!Secure',
};
