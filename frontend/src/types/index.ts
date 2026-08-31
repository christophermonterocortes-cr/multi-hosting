export interface User {
  id: string;
  email: string;
  username: string;
  role: 'ADMIN' | 'USER';
  isActive: boolean;
  projectCount?: number;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  ownerUsername?: string;
  ownerEmail?: string;
  runtimeType: 'STATIC' | 'PHP';
  port: number | null;
  url: string | null;
  domain: string | null;
  documentRoot: string;
  status: 'PROVISIONING' | 'RUNNING' | 'STOPPED' | 'SUSPENDED' | 'FAILED' | 'DELETED';
  containerId: string | null;
  containerName?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  lastDeployedAt: string | null;
  hasDatabase: boolean;
  databaseEngine?: 'POSTGRESQL' | 'MYSQL';
}

export interface DatabaseCredentials {
  engine: 'POSTGRESQL' | 'MYSQL';
  host: string;
  port: number;
  dbName: string;
  dbUser: string;
  password?: string;
  connectionUri: string;
  cliExample: string;
  pdoExample: string;
  envConfig: string;
  status: string;
}

export interface DatabaseInstance {
  id: string;
  projectId: string;
  projectName?: string;
  projectSlug?: string;
  engine: 'POSTGRESQL' | 'MYSQL';
  dbName: string;
  dbUser: string;
  host: string;
  port: number;
  createdAt: string;
  updatedAt: string;
}

export interface PortInfo {
  port: number;
  status: 'FREE' | 'ALLOCATED' | 'RESERVED' | 'OCCUPIED_HOST' | 'CONFLICT';
  projectId: string | null;
  projectName?: string;
  allocatedAt: string | null;
  releasedAt: string | null;
}

export interface PortMatrixResponse {
  startPort: number;
  endPort: number;
  total: number;
  allocatedCount: number;
  freeCount: number;
  ports: PortInfo[];
}

export interface SystemHealthMetrics {
  cpu: {
    loadPercent: number;
    cores: number;
    model: string;
  };
  memory: {
    totalMb: number;
    usedMb: number;
    freeMb: number;
    usagePercent: number;
  };
  disk: {
    totalGb: number;
    usedGb: number;
    freeGb: number;
    usagePercent: number;
  };
  docker: {
    available: boolean;
    version?: string;
    error?: string;
  };
  controlPlaneDb: {
    connected: boolean;
    totalProjects: number;
    totalUsers: number;
    allocatedPorts: number;
  };
  uptimeSeconds: number;
  timestamp: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  username: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  details: any;
  createdAt: string;
}

export interface FileItem {
  name: string;
  relativePath: string;
  isDirectory: boolean;
  size: number;
  extension: string;
  modifiedAt: string;
}

export interface ContainerStats {
  status: 'running' | 'stopped' | 'restarting' | 'exited' | 'unknown';
  cpuPercent: string;
  memoryUsage: string;
  memoryLimit: string;
  uptime: string;
}
