import https from 'https';
import { db } from '../config/database';

export interface CloudflareSettings {
  apiToken?: string;
  zoneId?: string;
  accountId?: string;
  tunnelTarget?: string; // e.g. <tunnel-id>.cfargotunnel.com
  enabled?: boolean;
}

export class CloudflareService {
  private static getSettings(): CloudflareSettings {
    try {
      const row = db.prepare("SELECT value FROM system_settings WHERE key = 'cloudflare_config'").get() as any;
      if (row && row.value) {
        return JSON.parse(row.value);
      }
    } catch {}

    return {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
      tunnelTarget: process.env.CLOUDFLARE_TUNNEL_TARGET || '',
      enabled: false
    };
  }

  public static saveSettings(settings: CloudflareSettings): void {
    const json = JSON.stringify(settings);
    const existing = db.prepare("SELECT key FROM system_settings WHERE key = 'cloudflare_config'").get();
    if (existing) {
      db.prepare("UPDATE system_settings SET value = ?, updated_at = datetime('now') WHERE key = 'cloudflare_config'").run(json);
    } else {
      db.prepare("INSERT INTO system_settings (key, value, created_at, updated_at) VALUES ('cloudflare_config', ?, datetime('now'), datetime('now'))").run(json);
    }
  }

  /**
   * Helper to make Cloudflare API HTTP requests
   */
  private static async cfRequest(method: string, path: string, token: string, body?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const data = body ? JSON.stringify(body) : null;
      const req = https.request({
        hostname: 'api.cloudflare.com',
        port: 443,
        path: `/client/v4${path}`,
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
        }
      }, (res) => {
        let responseBody = '';
        res.on('data', chunk => responseBody += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseBody);
            if (!parsed.success) {
              const err = parsed.errors?.[0]?.message || 'Cloudflare API Error';
              reject(new Error(err));
            } else {
              resolve(parsed.result);
            }
          } catch (e: any) {
            reject(new Error(`Failed to parse Cloudflare response: ${responseBody}`));
          }
        });
      });

      req.on('error', reject);
      if (data) req.write(data);
      req.end();
    });
  }

  /**
   * Automatically publish a subdomain CNAME to Cloudflare DNS
   */
  public static async autoPublishSubdomain(slug: string): Promise<{ success: boolean; message: string }> {
    const settings = this.getSettings();
    if (!settings.apiToken || !settings.zoneId || !settings.tunnelTarget) {
      return { success: false, message: 'Cloudflare API Token or Zone ID not configured' };
    }

    try {
      const payload = {
        type: 'CNAME',
        name: slug,
        content: settings.tunnelTarget,
        ttl: 1, // Auto TTL
        proxied: true
      };

      await this.cfRequest('POST', `/zones/${settings.zoneId}/dns_records`, settings.apiToken, payload);
      return { success: true, message: `Created DNS CNAME for ${slug}.multi-hosting.com on Cloudflare` };
    } catch (err: any) {
      console.warn(`Cloudflare auto-publish notice for ${slug}:`, err.message);
      return { success: false, message: err.message };
    }
  }

  /**
   * Remove DNS CNAME from Cloudflare when a project is deleted
   */
  public static async removeSubdomain(slug: string): Promise<void> {
    const settings = this.getSettings();
    if (!settings.apiToken || !settings.zoneId) return;

    try {
      // Find the record ID
      const records = await this.cfRequest('GET', `/zones/${settings.zoneId}/dns_records?type=CNAME&name=${slug}.multi-hosting.com`, settings.apiToken) as any[];
      if (records && records.length > 0) {
        for (const r of records) {
          await this.cfRequest('DELETE', `/zones/${settings.zoneId}/dns_records/${r.id}`, settings.apiToken);
        }
      }
    } catch (err: any) {
      console.warn(`Cloudflare remove DNS error for ${slug}:`, err.message);
    }
  }
}
