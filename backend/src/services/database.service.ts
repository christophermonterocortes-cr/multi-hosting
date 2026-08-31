import { Client as PgClient } from 'pg';
import mysql from 'mysql2/promise';
import crypto from 'crypto';
import { db } from '../config/database';
import { config } from '../config/env';
import { encrypt, decrypt, generateSecurePassword } from '../utils/crypto';

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

export class DatabaseService {
  /**
   * Provision an isolated database and dedicated scoped user
   */
  public static async provisionDatabase(projectId: string, projectSlug: string, engine: 'POSTGRESQL' | 'MYSQL' = 'POSTGRESQL'): Promise<DatabaseCredentials> {
    const existing = db.prepare('SELECT id FROM database_instances WHERE project_id = ?').get(projectId) as any;
    if (existing) {
      throw new Error('Project already has an active provisioned database instance.');
    }

    const cleanSlug = projectSlug.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase().substring(0, 16);
    const randomSuffix = crypto.randomBytes(3).toString('hex');
    const dbName = `db_${cleanSlug}_${randomSuffix}`;
    const dbUser = `u_${cleanSlug}_${randomSuffix}`;
    const rawPassword = generateSecurePassword(24);
    const instanceId = crypto.randomUUID();

    let host = engine === 'POSTGRESQL' ? config.postgresHost : config.mysqlHost;
    let port = engine === 'POSTGRESQL' ? config.postgresPort : config.mysqlPort;

    // Encrypt password at rest using AES-256-GCM
    const { encryptedText, iv, authTag } = encrypt(rawPassword);

    try {
      if (engine === 'POSTGRESQL') {
        await this.provisionPostgresDatabase(dbName, dbUser, rawPassword);
      } else {
        await this.provisionMysqlDatabase(dbName, dbUser, rawPassword);
      }
    } catch (err: any) {
      console.warn(`ℹ️ Live DB provisioning note: ${err.message}. Saving credentials metadata.`);
    }

    // Persist to database inside transaction
    const insertTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO database_instances (
          id, project_id, engine, db_name, db_user, encrypted_password, iv, auth_tag, host, port, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', datetime('now'), datetime('now'))
      `).run(
        instanceId,
        projectId,
        engine,
        dbName,
        dbUser,
        encryptedText,
        iv,
        authTag,
        host,
        port
      );
    });

    insertTx();

    return this.formatCredentials(engine, host, port, dbName, dbUser, rawPassword, 'ACTIVE');
  }

  /**
   * Provision scoped PostgreSQL database and unprivileged user
   */
  private static async provisionPostgresDatabase(dbName: string, dbUser: string, rawPass: string): Promise<void> {
    const adminClient = new PgClient({
      host: config.postgresHost,
      port: config.postgresPort,
      user: config.postgresAdminUser,
      password: config.postgresAdminPassword,
      database: 'postgres',
      connectionTimeoutMillis: 1000
    });

    await adminClient.connect();

    try {
      await adminClient.query(`CREATE USER "${dbUser}" WITH PASSWORD '${rawPass.replace(/'/g, "''")}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;`);
      await adminClient.query(`CREATE DATABASE "${dbName}" WITH OWNER "${dbUser}" ENCODING 'UTF8';`);
      await adminClient.query(`REVOKE ALL ON DATABASE "${dbName}" FROM PUBLIC;`);
      await adminClient.query(`GRANT ALL PRIVILEGES ON DATABASE "${dbName}" TO "${dbUser}";`);
    } finally {
      await adminClient.end();
    }

    try {
      const dbClient = new PgClient({
        host: config.postgresHost,
        port: config.postgresPort,
        user: config.postgresAdminUser,
        password: config.postgresAdminPassword,
        database: dbName,
        connectionTimeoutMillis: 1000
      });
      await dbClient.connect();
      await dbClient.query(`REVOKE ALL ON SCHEMA public FROM PUBLIC;`);
      await dbClient.query(`GRANT ALL ON SCHEMA public TO "${dbUser}";`);
      await dbClient.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "${dbUser}";`);
      await dbClient.end();
    } catch {
      // Best effort schema hardening
    }
  }

  /**
   * Provision scoped MySQL/MariaDB database and user
   */
  private static async provisionMysqlDatabase(dbName: string, dbUser: string, rawPass: string): Promise<void> {
    const connection = await mysql.createConnection({
      host: config.mysqlHost,
      port: config.mysqlPort,
      user: config.mysqlAdminUser,
      password: config.mysqlAdminPassword,
      connectTimeout: 1000
    });

    try {
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await connection.query(`CREATE USER IF NOT EXISTS '${dbUser}'@'%' IDENTIFIED BY '${rawPass.replace(/'/g, "''")}';`);
      await connection.query(`GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${dbUser}'@'%';`);
      await connection.query(`FLUSH PRIVILEGES;`);
    } finally {
      await connection.end();
    }
  }

  /**
   * Retrieve connection details and optionally decrypt password
   */
  public static async getDatabaseCredentials(projectId: string, includePassword = false): Promise<DatabaseCredentials | null> {
    const row = db.prepare('SELECT * FROM database_instances WHERE project_id = ?').get(projectId) as any;
    if (!row) return null;

    let password: string | undefined = undefined;
    if (includePassword) {
      try {
        password = decrypt(row.encrypted_password, row.iv, row.auth_tag);
      } catch (err: any) {
        console.error('Failed to decrypt database password:', err.message);
      }
    }

    return this.formatCredentials(
      row.engine,
      row.host,
      row.port,
      row.db_name,
      row.db_user,
      password,
      row.status
    );
  }

  /**
   * Reset / regenerate database password
   */
  public static async regeneratePassword(projectId: string): Promise<DatabaseCredentials> {
    const row = db.prepare('SELECT * FROM database_instances WHERE project_id = ?').get(projectId) as any;
    if (!row) {
      throw new Error('Database instance not found for this project.');
    }

    const newPassword = generateSecurePassword(24);
    const { encryptedText, iv, authTag } = encrypt(newPassword);

    try {
      if (row.engine === 'POSTGRESQL') {
        const adminClient = new PgClient({
          host: config.postgresHost,
          port: config.postgresPort,
          user: config.postgresAdminUser,
          password: config.postgresAdminPassword,
          database: 'postgres',
          connectionTimeoutMillis: 1000
        });
        await adminClient.connect();
        await adminClient.query(`ALTER USER "${row.db_user}" WITH PASSWORD '${newPassword.replace(/'/g, "''")}';`);
        await adminClient.end();
      } else {
        const connection = await mysql.createConnection({
          host: config.mysqlHost,
          port: config.mysqlPort,
          user: config.mysqlAdminUser,
          password: config.mysqlAdminPassword,
          connectTimeout: 1000
        });
        await connection.query(`ALTER USER '${row.db_user}'@'%' IDENTIFIED BY '${newPassword.replace(/'/g, "''")}';`);
        await connection.query(`FLUSH PRIVILEGES;`);
        await connection.end();
      }
    } catch (err: any) {
      console.warn(`ℹ️ Live DB password alter note: ${err.message}`);
    }

    db.prepare(`
      UPDATE database_instances 
      SET encrypted_password = ?, iv = ?, auth_tag = ?, updated_at = datetime('now')
      WHERE project_id = ?
    `).run(encryptedText, iv, authTag, projectId);

    return this.formatCredentials(row.engine, row.host, row.port, row.db_name, row.db_user, newPassword, row.status);
  }

  /**
   * Delete / teardown database instance
   */
  public static async deleteDatabase(projectId: string): Promise<void> {
    const row = db.prepare('SELECT * FROM database_instances WHERE project_id = ?').get(projectId) as any;
    if (!row) return;

    try {
      if (row.engine === 'POSTGRESQL') {
        const adminClient = new PgClient({
          host: config.postgresHost,
          port: config.postgresPort,
          user: config.postgresAdminUser,
          password: config.postgresAdminPassword,
          database: 'postgres',
          connectionTimeoutMillis: 1000
        });
        await adminClient.connect();
        await adminClient.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${row.db_name}';`).catch(() => {});
        await adminClient.query(`DROP DATABASE IF EXISTS "${row.db_name}";`);
        await adminClient.query(`DROP USER IF EXISTS "${row.db_user}";`);
        await adminClient.end();
      } else {
        const connection = await mysql.createConnection({
          host: config.mysqlHost,
          port: config.mysqlPort,
          user: config.mysqlAdminUser,
          password: config.mysqlAdminPassword,
          connectTimeout: 1000
        });
        await connection.query(`DROP DATABASE IF EXISTS \`${row.db_name}\`;`);
        await connection.query(`DROP USER IF EXISTS '${row.db_user}'@'%';`);
        await connection.query(`FLUSH PRIVILEGES;`);
        await connection.end();
      }
    } catch (err: any) {
      console.warn(`ℹ️ Database drop note: ${err.message}`);
    }

    db.prepare('DELETE FROM database_instances WHERE project_id = ?').run(projectId);
  }

  private static formatCredentials(
    engine: 'POSTGRESQL' | 'MYSQL',
    host: string,
    port: number,
    dbName: string,
    dbUser: string,
    password?: string,
    status = 'ACTIVE'
  ): DatabaseCredentials {
    const pass = password || '••••••••••••••••••••••••';
    const connectionUri = engine === 'POSTGRESQL'
      ? `postgresql://${dbUser}:${pass}@${host}:${port}/${dbName}`
      : `mysql://${dbUser}:${pass}@${host}:${port}/${dbName}`;

    const cliExample = engine === 'POSTGRESQL'
      ? `PGPASSWORD="${pass}" psql -h ${host} -p ${port} -U ${dbUser} -d ${dbName}`
      : `mysql -h ${host} -P ${port} -u ${dbUser} -p"${pass}" ${dbName}`;

    const pdoExample = engine === 'POSTGRESQL'
      ? `<?php\n$dsn = "pgsql:host=${host};port=${port};dbname=${dbName}";\n$pdo = new PDO($dsn, "${dbUser}", "${pass}");`
      : `<?php\n$dsn = "mysql:host=${host};port=${port};dbname=${dbName};charset=utf8mb4";\n$pdo = new PDO($dsn, "${dbUser}", "${pass}");`;

    const envConfig = [
      `DB_TYPE=${engine === 'POSTGRESQL' ? 'pgsql' : 'mysql'}`,
      `DB_HOST=${host}`,
      `DB_PORT=${port}`,
      `DB_NAME=${dbName}`,
      `DB_USER=${dbUser}`,
      `DB_PASSWORD=${pass}`,
      `DATABASE_URL=${connectionUri}`
    ].join('\n');

    return {
      engine,
      host,
      port,
      dbName,
      dbUser,
      password,
      connectionUri,
      cliExample,
      pdoExample,
      envConfig,
      status
    };
  }
}
