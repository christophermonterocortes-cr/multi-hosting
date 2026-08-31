#!/usr/bin/env bash
set -e

REMOTE_HOST="192.168.100.81"
REMOTE_USER="root"
REMOTE_DIR="/opt/multi-hosting"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Deploying Multi Hosting to ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}..."

# Create remote directory
ssh -o StrictHostKeyChecking=no "${REMOTE_USER}@${REMOTE_HOST}" "mkdir -p ${REMOTE_DIR}"

# Rsync codebase to remote host (excluding node_modules and temp data)
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'data/tmp' \
  --exclude 'data/projects' \
  --exclude 'backend/node_modules' \
  --exclude 'frontend/node_modules' \
  "${SCRIPT_DIR}/" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

# Execute remote docker-compose deployment
ssh -o StrictHostKeyChecking=no "${REMOTE_USER}@${REMOTE_HOST}" "
  cd ${REMOTE_DIR}
  if [ ! -f .env ]; then
    cp .env.example .env
    sed -i 's/SERVER_IP=127.0.0.1/SERVER_IP=${REMOTE_HOST}/g' .env
  fi
  docker compose up -d --build
  echo '=================================================='
  echo '✅ Multi Hosting successfully deployed on ${REMOTE_HOST}!'
  echo '🌐 Frontend Dashboard: http://${REMOTE_HOST}:3000'
  echo '📡 Backend API & Docs: http://${REMOTE_HOST}:5000/api/docs'
  echo '=================================================='
"
