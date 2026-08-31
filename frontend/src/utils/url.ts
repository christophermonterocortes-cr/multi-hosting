/**
 * Resolves the appropriate live URL for a project based on the client's current LAN IP / hostname
 */
export function getProjectUrl(project: {
  domain?: string | null;
  port?: number | null;
  url?: string | null;
}): string {
  if (project.domain) {
    return project.domain.startsWith('http') ? project.domain : `http://${project.domain}`;
  }

  if (project.port) {
    const hostname = typeof window !== 'undefined' && window.location.hostname
      ? window.location.hostname
      : '127.0.0.1';
    return `http://${hostname}:${project.port}`;
  }

  return project.url || '#';
}
