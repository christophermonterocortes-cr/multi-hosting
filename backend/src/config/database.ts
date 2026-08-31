import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { config } from './env';

// Ensure data and database directories exist
const dbDir = path.dirname(config.databaseFile);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
if (!fs.existsSync(config.projectsDir)) {
  fs.mkdirSync(config.projectsDir, { recursive: true });
}
if (!fs.existsSync(config.backupsDir)) {
  fs.mkdirSync(config.backupsDir, { recursive: true });
}

export const db = new Database(config.databaseFile, {
  // verbose: config.env === 'development' ? console.log : undefined
});

// Configure SQLite for high concurrency and data safety
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

export function initDatabase() {
  let schemaPath = path.resolve(__dirname, '../models/schema.sql');
  if (!fs.existsSync(schemaPath)) {
    schemaPath = path.resolve(__dirname, '../../src/models/schema.sql');
  }
  if (!fs.existsSync(schemaPath)) {
    schemaPath = path.resolve(process.cwd(), 'src/models/schema.sql');
  }
  
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);

  // Initialize default system settings if not present
  const checkSetting = db.prepare('SELECT value FROM system_settings WHERE key = ?');
  const insertSetting = db.prepare('INSERT INTO system_settings (key, value, description) VALUES (?, ?, ?)');

  const defaults = [
    { key: 'port_range_start', value: config.portRangeStart.toString(), description: 'Start of port allocation range' },
    { key: 'port_range_end', value: config.portRangeEnd.toString(), description: 'End of port allocation range' },
    { key: 'server_ip', value: config.serverIp, description: 'Default public server IP or domain' },
    { key: 'max_upload_size_mb', value: '100', description: 'Max website upload size in Megabytes' },
    { key: 'allow_user_registrations', value: 'true', description: 'Allow public self-registration' }
  ];

  for (const s of defaults) {
    if (!checkSetting.get(s.key)) {
      insertSetting.run(s.key, s.value, s.description);
    }
  }

  console.log('✅ Control panel database initialized and ready.');
}
