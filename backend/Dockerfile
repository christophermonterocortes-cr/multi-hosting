FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y python3 build-essential && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:20-slim

# Install Docker CLI & database clients from standard Debian repositories
RUN apt-get update && apt-get install -y docker.io postgresql-client default-mysql-client && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY src/models/schema.sql ./dist/models/schema.sql

EXPOSE 5000

ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
