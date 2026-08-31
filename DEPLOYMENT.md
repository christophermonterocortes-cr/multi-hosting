# Ubuntu & Debian Server Deployment Guide 🌐

Step-by-step guide for deploying Multi Hosting to a production Linux server (Ubuntu 22.04 / 24.04 LTS or Debian 12).

---

## 1. System Preparation & Docker Installation

Update system packages and install Docker and Docker Compose:

```bash
# Update repositories
sudo apt update && sudo apt upgrade -y

# Install prerequisites
sudo apt install -y curl gnupg lsb-release ca-certificates

# Install Docker
curl -fsSL https://get.docker.com | sudo sh

# Allow non-root user to manage Docker (optional)
sudo usermod -aG docker $USER

# Verify Docker and Docker Compose
docker --version
docker compose version
```

---

## 2. Firewall Configuration (UFW)

Configure Ubuntu's uncomplicated firewall (UFW) to allow SSH, HTTP, HTTPS, and the application port range:

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow Web Traffic (Control Panel & Gateway)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp # Frontend Dashboard (if directly accessed)
sudo ufw allow 5000/tcp # Backend API (if directly accessed)

# Allow Website Hosting Port Range
sudo ufw allow 16000:20000/tcp

# Enable Firewall
sudo ufw enable
sudo ufw status
```

---

## 3. Deploying Multi Hosting

```bash
# Clone or copy the multi-hosting codebase
cd /opt
sudo git clone <your-repository-url> multi-hosting
cd multi-hosting

# Create your production environment file
cp .env.example .env

# Edit environment settings
nano .env
```

Ensure you configure:
- `SERVER_IP`: Your public server IP address (e.g. `203.0.113.50`).
- `JWT_SECRET`: A generated 32+ character random string.
- `ENCRYPTION_KEY`: A generated 32-character random string.
- `POSTGRES_ADMIN_PASSWORD`: Strong password for managed PostgreSQL server.
- `MYSQL_ADMIN_PASSWORD`: Strong password for managed MariaDB server.
- `DEFAULT_ADMIN_PASSWORD`: Strong password for the platform administrator.

---

## 4. Starting the Platform

```bash
# Build and start all services in the background
sudo docker compose up -d --build

# View container logs
sudo docker compose logs -f
```

---

## 5. Systemd Service (Auto-Start on Boot)

To ensure Multi Hosting starts automatically upon system reboot, create a systemd service:

```bash
sudo nano /etc/systemd/system/multihosting.service
```

Paste the following configuration:

```ini
[Unit]
Description=Multi Hosting Cloud Platform
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/multi-hosting
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable multihosting.service
```
