import { Request, Response, NextFunction } from 'express';
import http from 'http';
import { db } from '../config/database';
import { config } from '../config/env';

export class VHostService {
  /**
   * Middleware to intercept and route subdomain traffic (e.g., example.multi-hosting.com or custom domains)
   */
  public static handle(req: Request, res: Response, next: NextFunction): void {
    const rawHost = req.get('x-forwarded-host') || req.get('host') || '';
    const hostname = rawHost.split(':')[0].toLowerCase().trim();

    // 1. Check if request is directed to the core management platform or direct IP
    if (
      !hostname ||
      hostname === 'multi-hosting.com' ||
      hostname === 'www.multi-hosting.com' ||
      hostname === 'app.multi-hosting.com' ||
      hostname === 'dash.multi-hosting.com' ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '192.168.0.245' ||
      hostname === config.serverIp ||
      req.path.startsWith('/api') ||
      req.path.startsWith('/phpmyadmin')
    ) {
      return next();
    }

    // 2. Extract subdomain or custom domain
    let slugOrDomain = hostname;
    if (hostname.endsWith('.multi-hosting.com')) {
      slugOrDomain = hostname.replace(/\.multi-hosting\.com$/, '');
    }

    // Ignore www. or app. subdomains if passed here
    if (slugOrDomain === 'www' || slugOrDomain === 'app' || slugOrDomain === 'dash') {
      return next();
    }

    // 3. Query project by slug or domain
    try {
      const project = db.prepare(`
        SELECT id, name, slug, port, status, runtime_type, domain
        FROM projects
        WHERE (slug = ? OR domain = ?) AND status != 'DELETED'
      `).get(slugOrDomain, hostname) as any;

      if (!project) {
        res.status(404).send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>404 // Workload Unregistered</title>
            <style>
              body { background: #101216; color: #e6edf3; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; box-sizing: border-box; }
              .card { background: #181b22; border: 2px solid #2a303c; padding: 2rem; max-width: 520px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.8); }
              .badge { display: inline-block; background: #2a303c; color: #ffaa00; font-size: 0.75rem; font-weight: bold; padding: 0.2rem 0.5rem; margin-bottom: 1rem; border: 1px solid #3b4354; }
              .title { color: #ffaa00; font-size: 1.25rem; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 0.75rem; }
              p { color: #8b949e; font-size: 0.85rem; line-height: 1.5; margin: 0 0 1.25rem 0; }
              .code { background: #101216; border: 1px solid #2a303c; padding: 0.75rem; color: #e6edf3; font-size: 0.8rem; margin-bottom: 1.25rem; word-break: break-all; }
              .footer { border-top: 1px solid #2a303c; padding-top: 1rem; color: #484f58; font-size: 0.75rem; display: flex; justify-content: space-between; align-items: center; }
              a { color: #ffaa00; text-decoration: none; font-weight: bold; }
              a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="badge">HTTP 404 FAULT</div>
              <div class="title">[ NO WORKLOAD REGISTERED ]</div>
              <p>The requested subdomain is not mapped to any active container blade on this on-premises node.</p>
              <div class="code">HOST: ${hostname}<br>SUBDOMAIN SLUG: ${slugOrDomain}</div>
              <div class="footer">
                <span>MULTI-HOSTING SWITCHBOARD</span>
                <a href="https://www.multi-hosting.com">CONTROL DECK &rarr;</a>
              </div>
            </div>
          </body>
          </html>
        `);
        return;
      }

      if (project.status !== 'RUNNING' || !project.port) {
        res.status(503).send(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>503 // Container Workload Offline</title>
            <style>
              body { background: #101216; color: #e6edf3; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 1rem; box-sizing: border-box; }
              .card { background: #181b22; border: 2px solid #e03131; padding: 2rem; max-width: 520px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.8); }
              .badge { display: inline-block; background: rgba(224,49,49,0.15); color: #e03131; font-size: 0.75rem; font-weight: bold; padding: 0.2rem 0.5rem; margin-bottom: 1rem; border: 1px solid rgba(224,49,49,0.4); }
              .title { color: #e03131; font-size: 1.25rem; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 0.75rem; }
              p { color: #8b949e; font-size: 0.85rem; line-height: 1.5; margin: 0 0 1.25rem 0; }
              .code { background: #101216; border: 1px solid #2a303c; padding: 0.75rem; color: #e6edf3; font-size: 0.8rem; margin-bottom: 1.25rem; }
              .footer { border-top: 1px solid #2a303c; padding-top: 1rem; color: #484f58; font-size: 0.75rem; display: flex; justify-content: space-between; align-items: center; }
              a { color: #ffaa00; text-decoration: none; font-weight: bold; }
              a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="badge">CIRCUIT BREAKER: STOPPED</div>
              <div class="title">[ CONTAINER WORKLOAD OFFLINE ]</div>
              <p>The unit blade <strong>${project.name}</strong> is provisioned on this node but the container is currently <strong>${project.status}</strong>.</p>
              <div class="code">UNIT: ${project.name}<br>SOCKET: :${project.port || 'UNBOUND'}<br>STATUS: ${project.status}</div>
              <div class="footer">
                <span>MULTI-HOSTING SWITCHBOARD</span>
                <a href="https://www.multi-hosting.com">START WORKLOAD &rarr;</a>
              </div>
            </div>
          </body>
          </html>
        `);
        return;
      }

      // 4. Stream reverse proxy request directly to the container
      const targetHost = (config.serverIp && config.serverIp !== '127.0.0.1' && config.serverIp !== '0.0.0.0' && config.serverIp !== 'localhost')
        ? config.serverIp
        : '192.168.0.245';
      const targetPort = project.port;

      const proxyReq = http.request({
        hostname: targetHost,
        port: targetPort,
        path: req.url,
        method: req.method,
        headers: {
          ...req.headers,
          host: rawHost,
          'x-forwarded-host': rawHost,
          'x-forwarded-proto': req.headers['x-forwarded-proto'] || 'http',
          'x-real-ip': req.ip || req.socket.remoteAddress
        }
      }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
        proxyRes.pipe(res);
      });

      proxyReq.on('error', (err) => {
        console.error(`VHost proxy transmission error for ${slugOrDomain} (:${targetPort}):`, err.message);
        if (!res.headersSent) {
          res.status(502).send(`[ 502 // PROXY TRANSMISSION FAULT TO CONTAINER :${targetPort} ]`);
        }
      });

      req.pipe(proxyReq);

    } catch (err: any) {
      console.error('VHost resolution error:', err.message);
      next();
    }
  }
}
