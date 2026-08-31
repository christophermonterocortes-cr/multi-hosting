# Multi-stage production build for Frontend SPA
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json vite.config.ts index.html tailwind.config.js postcss.config.js ./
COPY public/ ./public/
COPY src/ ./src/

RUN npm run build

# Final static delivery stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
