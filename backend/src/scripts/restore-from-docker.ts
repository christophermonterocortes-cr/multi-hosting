import { db, initDatabase } from '../config/database';
import { encrypt } from '../utils/crypto';
import { config } from '../config/env';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function restoreProjects() {
  console.log('🔄 Initializing database schema...');
  initDatabase();

  // Ensure admin user exists
  const adminUser = db.prepare("SELECT id FROM users WHERE username = 'admin'").get() as { id: string } | undefined;
  let adminId = adminUser?.id;
  if (!adminId) {
    const defaultAdmin = db.prepare("SELECT id FROM users LIMIT 1").get() as { id: string } | undefined;
    adminId = defaultAdmin?.id || 'admin-default-id';
  }

  console.log('🔍 Inspecting all Docker containers on host...');
  let rawContainers = '';
  try {
    rawContainers = execSync("docker ps -a --filter 'name=mh_site_' --format '{{.ID}}|{{.Names}}'", { encoding: 'utf8' });
  } catch (e) {
    console.error('Failed to list Docker containers:', e);
    return;
  }

  const containerLines = rawContainers.trim().split('\n').filter(Boolean);
  console.log(`Found ${containerLines.length} multi-hosting containers on host.`);

  // Get all MariaDB databases
  let mariaDbs: string[] = [];
  try {
    const raw = execSync("docker exec multihosting_managed_mariadb mariadb -uroot -pmysql_admin_pass_multi_hosting -e 'SHOW DATABASES;' -s -N 2>/dev/null", { encoding: 'utf8' });
    mariaDbs = raw.trim().split('\n').filter(d => d.startsWith('db_'));
  } catch (e) {
    console.warn('Could not list MariaDB databases:', (e as any).message);
  }

  // Get all PostgreSQL databases
  let pgDbs: string[] = [];
  try {
    const raw = execSync("docker exec multihosting_managed_postgres psql -U postgres -t -A -c 'SELECT datname FROM pg_database WHERE datname LIKE \\'db_%\\';' 2>/dev/null", { encoding: 'utf8' });
    pgDbs = raw.trim().split('\n').filter(d => d.startsWith('db_'));
  } catch (e) {
    console.warn('Could not list PostgreSQL databases:', (e as any).message);
  }

  console.log(`Found ${mariaDbs.length} MariaDB databases and ${pgDbs.length} PostgreSQL databases.`);

  const insertProject = db.prepare(`
    INSERT OR REPLACE INTO projects (
      id, name, slug, owner_id, runtime_type, port, status, domain, document_root, container_id, container_name, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  const insertPort = db.prepare(`
    INSERT OR REPLACE INTO assigned_ports (
      port, project_id, status, allocated_at
    ) VALUES (?, ?, 'ALLOCATED', datetime('now'))
  `);

  const insertDb = db.prepare(`
    INSERT OR REPLACE INTO database_instances (
      id, project_id, engine, db_name, db_user, encrypted_password, iv, auth_tag, host, port, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
  `);

  for (const line of containerLines) {
    const [cId, cName] = line.split('|');
    console.log(`\nProcessing container: ${cName} (${cId})`);
    const inspectRaw = execSync(`docker inspect ${cId}`, { encoding: 'utf8' });
    const info = JSON.parse(inspectRaw)[0];

    const containerName = (info.Name || cName).replace(/^\//, '');
    const slug = containerName.replace(/^mh_site_/, '');
    
    // Extract project ID from mounts
    let projectId = '';
    const mounts = info.Mounts || [];
    for (const m of mounts) {
      if (m.Destination === '/var/www/html' || m.Destination === '/var/www/html/public') {
        const parts = m.Source.split('/');
        projectId = parts[parts.length - 1];
        break;
      }
    }

    if (!projectId || projectId === 'html') {
      projectId = `proj-${slug}`;
    }

    // Determine runtime
    const image = info.Config?.Image || '';
    const isPhp = image.includes('php') || (info.NetworkSettings?.Ports && '9000/tcp' in info.NetworkSettings.Ports);
    const runtimeType = isPhp ? 'PHP' : 'STATIC';

    // Determine port
    let hostPort: number | null = null;
    const portBindings = info.HostConfig?.PortBindings || info.NetworkSettings?.Ports || {};
    const httpBinding = portBindings['80/tcp'];
    if (httpBinding && httpBinding.length > 0 && httpBinding[0].HostPort) {
      hostPort = parseInt(httpBinding[0].HostPort, 10);
    }

    // Format friendly project name from slug
    const name = slug
      .split('-')
      .slice(0, -1)
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') || slug;

    const status = info.State?.Running ? 'RUNNING' : 'STOPPED';

    // Ensure project directory on disk exists
    const projDir = path.join(config.projectsDir, projectId);
    if (!fs.existsSync(projDir)) {
      fs.mkdirSync(projDir, { recursive: true });
    }

    // If directory is empty, create initial template
    const existingFiles = fs.readdirSync(projDir);
    if (existingFiles.length === 0) {
      if (runtimeType === 'STATIC') {
        fs.writeFileSync(path.join(projDir, 'index.html'), `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${name}</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #1e293b; padding: 2rem; border-radius: 1rem; text-align: center; border: 1px solid #334155; }
    h1 { color: #38bdf8; margin-top: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${name}</h1>
    <p>Static Website hosted on Multi Hosting Platform</p>
    <p>Port: <strong>${hostPort || 'Dynamic'}</strong></p>
  </div>
</body>
</html>`);
      } else {
        fs.writeFileSync(path.join(projDir, 'index.php'), `<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${name} - PHP App</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #1e293b; padding: 2rem; border-radius: 1rem; text-align: center; border: 1px solid #334155; }
    h1 { color: #a855f7; margin-top: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${name}</h1>
    <p>PHP Workload Active (PHP <?= phpversion() ?>)</p>
    <p>Port: <strong>${hostPort || 'Dynamic'}</strong></p>
  </div>
</body>
</html>`);
      }
    }

    // Insert project
    insertProject.run(
      projectId,
      name,
      slug,
      adminId,
      runtimeType,
      hostPort,
      status,
      null,
      '/',
      info.Id,
      containerName
    );

    if (hostPort) {
      insertPort.run(hostPort, projectId);
    }

    console.log(`✅ Restored project '${name}' (${slug}) on port ${hostPort} [${runtimeType}] [${status}]`);

    // Match DB if any
    const slugClean = slug.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const matchedMaria = mariaDbs.find(d => d.includes(slugClean.slice(0, 10)));
    const matchedPg = pgDbs.find(d => d.includes(slugClean.slice(0, 10)));

    if (matchedMaria) {
      const dbUser = 'u_' + matchedMaria.slice(3);
      const defaultPass = '^#wyH2$RJXihki+sDTYjSYTo';
      const enc = encrypt(defaultPass);
      insertDb.run(
        `db-${projectId}`,
        projectId,
        'MYSQL',
        matchedMaria,
        dbUser,
        enc.encryptedText,
        enc.iv,
        enc.authTag,
        'mariadb-managed',
        3306
      );
      console.log(`   Linked MariaDB database: ${matchedMaria}`);
    } else if (matchedPg) {
      const dbUser = 'u_' + matchedPg.slice(3);
      const defaultPass = '^#wyH2$RJXihki+sDTYjSYTo';
      const enc = encrypt(defaultPass);
      insertDb.run(
        `db-${projectId}`,
        projectId,
        'POSTGRESQL',
        matchedPg,
        dbUser,
        enc.encryptedText,
        enc.iv,
        enc.authTag,
        'postgres-managed',
        5432
      );
      console.log(`   Linked PostgreSQL database: ${matchedPg}`);
    }
  }

  console.log('\n🎉 ALL PROJECTS AND DATABASES RESTORED SUCCESSFULLY!');
}

restoreProjects().catch(console.error);
