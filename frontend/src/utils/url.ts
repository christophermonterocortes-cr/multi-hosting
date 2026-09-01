/**
 * Resolves project endpoints:
 * 1. LAN URL: http://<LAN_IP>:<PORT> (direct container socket)
 * 2. Public URL: https://<SLUG>.multi-hosting.com (or custom domain)
 */
export interface ProjectEndpoints {
  lanUrl: string | null;
  publicUrl: string | null;
  primaryUrl: string;
}

export function getProjectEndpoints(project: {
  slug?: string | null;
  domain?: string | null;
  port?: number | null;
  url?: string | null;
}): ProjectEndpoints {
  const currentHostname = typeof window !== 'undefined' && window.location.hostname
    ? window.location.hostname
    : '192.168.0.245';

  const isDomainAccess = currentHostname.includes('multi-hosting.com');
  const lanHost = isDomainAccess || currentHostname === 'localhost' || currentHostname === '127.0.0.1'
    ? '192.168.0.245'
    : currentHostname;

  const lanUrl = project.port ? `http://${lanHost}:${project.port}` : null;
  const publicUrl = project.domain
    ? (project.domain.startsWith('http') ? project.domain : `https://${project.domain}`)
    : project.slug
      ? `https://${project.slug}.multi-hosting.com`
      : null;

  return {
    lanUrl,
    publicUrl,
    primaryUrl: publicUrl || lanUrl || project.url || '#'
  };
}

export function getProjectUrl(project: {
  slug?: string | null;
  domain?: string | null;
  port?: number | null;
  url?: string | null;
}): string {
  const { primaryUrl } = getProjectEndpoints(project);
  return primaryUrl;
}
