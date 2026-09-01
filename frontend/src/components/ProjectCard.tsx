import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Square, 
  RotateCw, 
  FolderTree, 
  Database, 
  Terminal, 
  ExternalLink, 
  Trash2,
  Copy,
  Check
} from 'lucide-react';
import { Project } from '../types';
import { getProjectEndpoints } from '../utils/url';
import { useLanguage } from '../context/LanguageContext';

interface ProjectCardProps {
  project: Project;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onRestart: (id: string) => void;
  onDelete: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onStart,
  onStop,
  onRestart,
  onDelete
}) => {
  const navigate = useNavigate();
  const { lanUrl, publicUrl } = getProjectEndpoints(project);
  const [copiedType, setCopiedType] = useState<'lan' | 'public' | null>(null);

  const handleCopy = (e: React.MouseEvent, text: string, type: 'lan' | 'public') => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const isRunning = project.status === 'RUNNING';

  return (
    <div className="rack-blade p-4 border-rack-border bg-rack-panel flex flex-col justify-between space-y-4 font-mono select-none">
      {/* 1U Header Plate */}
      <div>
        <div className="flex items-start justify-between gap-2 border-b border-rack-border pb-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isRunning ? 'bg-signal-amber filament-amber' : 'bg-trace-subtle'}`} />
              <h3 
                onClick={() => navigate(`/projects/${project.id}`)}
                className="font-display font-bold text-sm text-trace-silver hover:text-signal-amber cursor-pointer truncate"
                title={project.name}
              >
                {project.name}
              </h3>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[10px] text-trace-dim">
              <span className="bg-rack-bg border border-rack-border px-1.5 py-0.2 uppercase font-bold text-trace-silver">
                {project.runtimeType}
              </span>
              <span>SLUG: {project.slug}</span>
            </div>
          </div>

          <div className="text-right">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 border ${
              isRunning 
                ? 'bg-signal-amber/10 text-signal-amber border-signal-amber/40' 
                : 'bg-rack-bg text-trace-dim border-rack-border'
            }`}>
              {isRunning ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Dual Routing Bus: Public Cloudflare + Direct LAN */}
        <div className="mt-3 bg-rack-bg border border-rack-border p-2.5 space-y-2 text-[11px]">
          {/* Public Cloudflare Endpoint */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-[10px] text-trace-dim">
              <span className="flex items-center gap-1 font-bold text-signal-amber">
                <span>🌐 CLOUDFLARE ENDPOINT</span>
              </span>
              <span className="text-trace-subtle">HTTPS</span>
            </div>
            <div className="flex items-center justify-between gap-1 bg-rack-panel border border-rack-border/60 px-2 py-1">
              <a
                href={publicUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className="text-trace-silver hover:text-signal-amber hover:underline truncate font-bold text-[11px]"
                title={publicUrl || ''}
              >
                {publicUrl || 'N/A'}
              </a>
              {publicUrl && (
                <button
                  onClick={(e) => handleCopy(e, publicUrl, 'public')}
                  className="text-trace-dim hover:text-signal-amber p-0.5 shrink-0"
                  title="Copy Public URL"
                >
                  {copiedType === 'public' ? <Check className="h-3 w-3 text-signal-amber" /> : <Copy className="h-3 w-3" />}
                </button>
              )}
            </div>
          </div>

          {/* Direct LAN Socket */}
          <div className="space-y-0.5 pt-1 border-t border-rack-border/40">
            <div className="flex items-center justify-between text-[10px] text-trace-dim">
              <span className="font-bold text-trace-silver">⚡ LAN SOCKET</span>
              <span className="text-signal-amber font-mono font-bold">
                {project.port ? `:${project.port}` : 'UNBOUND'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-1 bg-rack-panel border border-rack-border/60 px-2 py-1">
              {lanUrl ? (
                <>
                  <a
                    href={lanUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-trace-dim hover:text-signal-amber hover:underline truncate text-[11px]"
                    title={lanUrl}
                  >
                    {lanUrl}
                  </a>
                  <button
                    onClick={(e) => handleCopy(e, lanUrl, 'lan')}
                    className="text-trace-dim hover:text-signal-amber p-0.5 shrink-0"
                    title="Copy LAN Address"
                  >
                    {copiedType === 'lan' ? <Check className="h-3 w-3 text-signal-amber" /> : <Copy className="h-3 w-3" />}
                  </button>
                </>
              ) : (
                <span className="text-trace-subtle text-[10px]">CONTAINER OFFLINE</span>
              )}
            </div>
          </div>

          {project.hasDatabase && (
            <div className="flex items-center justify-between border-t border-rack-border/50 pt-1 text-[10px]">
              <span className="text-trace-dim">DATABASE ENGINE:</span>
              <span className="text-trace-silver font-bold uppercase">
                {project.databaseEngine || 'SQLITE/PG'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Control Actuators */}
      <div className="flex items-center justify-between border-t border-rack-border pt-3 gap-2">
        {/* Navigation Switches */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(`/projects/${project.id}?tab=files`)}
            className="btn-rack text-[10px] px-2 py-1 flex items-center gap-1"
            title="Filesystem"
          >
            <FolderTree className="h-3 w-3 text-trace-dim" />
            <span>FILES</span>
          </button>

          {project.hasDatabase && (
            <button
              onClick={() => navigate(`/projects/${project.id}?tab=database`)}
              className="btn-rack text-[10px] px-2 py-1 flex items-center gap-1"
              title="Database"
            >
              <Database className="h-3 w-3 text-trace-dim" />
              <span>DB</span>
            </button>
          )}

          <button
            onClick={() => navigate(`/projects/${project.id}?tab=logs`)}
            className="btn-rack text-[10px] px-2 py-1 flex items-center gap-1"
            title="Logs"
          >
            <Terminal className="h-3 w-3 text-trace-dim" />
            <span>LOGS</span>
          </button>
        </div>

        {/* Power & Breakers */}
        <div className="flex items-center gap-1">
          {isRunning ? (
            <>
              <button
                onClick={() => onRestart(project.id)}
                className="btn-rack text-[10px] p-1.5"
                title="Restart Unit"
                aria-label="Restart Container"
              >
                <RotateCw className="h-3 w-3 text-trace-dim hover:text-signal-amber" />
              </button>
              <button
                onClick={() => onStop(project.id)}
                className="btn-rack text-[10px] p-1.5 text-signal-amber"
                title="Stop Unit"
                aria-label="Stop Container"
              >
                <Square className="h-3 w-3 fill-signal-amber" />
              </button>
            </>
          ) : (
            <button
              onClick={() => onStart(project.id)}
              className="btn-rack btn-rack-primary text-[10px] p-1.5"
              title="Start Unit"
              aria-label="Start Container"
            >
              <Play className="h-3 w-3 fill-current" />
            </button>
          )}

          <button
            onClick={() => onDelete(project)}
            className="btn-rack btn-rack-danger text-[10px] p-1.5"
            title="Delete Unit"
            aria-label="Delete Container"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
