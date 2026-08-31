# Backup and Disaster Recovery Guide 💾

This guide outlines backup and restore procedures for the Multi Hosting control plane, tenant files, and managed databases.

---

## 1. Backup Strategy Overview

Multi Hosting consists of three main data components:

1. **Control Plane Database**: `data/db/multi_hosting.sqlite` (SQLite database containing users, projects, port mappings, credentials, audit logs).
2. **Website Files**: `data/projects/` (all hosted HTML/PHP scripts and assets).
3. **Managed Database Stores**:
   - PostgreSQL volume: `postgres_data`
   - MariaDB/MySQL volume: `mariadb_data`

---

## 2. Automated Daily Backup Script

Save this script as `/opt/multi-hosting/backup.sh` and make it executable (`chmod +x backup.sh`):

```bash
#!/bin/bash
set -e

BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/opt/multi-hosting/data/backups/${BACKUP_DATE}"
mkdir -p "${BACKUP_DIR}"

echo "📦 Starting Multi Hosting backup for ${BACKUP_DATE}..."

# 1. Backup Control Plane Database using SQLite online vacuum/backup
sqlite3 /opt/multi-hosting/data/db/multi_hosting.sqlite ".backup '${BACKUP_DIR}/multi_hosting.sqlite'"

# 2. Backup Tenant Website Files
tar -czf "${BACKUP_DIR}/projects_files.tar.gz" -C /opt/multi-hosting/data projects

# 3. Dump Managed PostgreSQL Server Databases
docker exec multihosting_managed_postgres pg_dumpall -U postgres > "${BACKUP_DIR}/all_postgres_databases.sql"

# 4. Dump Managed MariaDB Server Databases
docker exec multihosting_managed_mariadb mariadb-dump --all-databases -u root -p"${MYSQL_ADMIN_PASSWORD}" > "${BACKUP_DIR}/all_mariadb_databases.sql"

# 5. Compress entire snapshot
tar -czf "/opt/multi-hosting/data/backups/snapshot_${BACKUP_DATE}.tar.gz" -C "/opt/multi-hosting/data/backups" "${BACKUP_DATE}"
rm -rf "${BACKUP_DIR}"

echo "✅ Backup complete: /opt/multi-hosting/data/backups/snapshot_${BACKUP_DATE}.tar.gz"
```

### Schedule via Cron
To run this backup daily at 02:00 AM:
```bash
sudo crontab -e
# Add line:
0 2 * * * /opt/multi-hosting/backup.sh >> /var/log/multihosting_backup.log 2>&1
```

---

## 3. Disaster Recovery & Restore

### Restoring Control Plane Database & Project Files
```bash
# 1. Stop platform containers
docker compose down

# 2. Extract backup snapshot
tar -xzf /path/to/snapshot_YYYYMMDD_HHMMSS.tar.gz -C /tmp/restore/

# 3. Restore SQLite database and files
cp /tmp/restore/multi_hosting.sqlite /opt/multi-hosting/data/db/multi_hosting.sqlite
tar -xzf /tmp/restore/projects_files.tar.gz -C /opt/multi-hosting/data/

# 4. Start database engines
docker compose up -d postgres-managed mariadb-managed

# 5. Restore Database Dumps
docker exec -i multihosting_managed_postgres psql -U postgres < /tmp/restore/all_postgres_databases.sql
docker exec -i multihosting_managed_mariadb mysql -u root -p"${MYSQL_ADMIN_PASSWORD}" < /tmp/restore/all_mariadb_databases.sql

# 6. Start full platform
docker compose up -d
```
