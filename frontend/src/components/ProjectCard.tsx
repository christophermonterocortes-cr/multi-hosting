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
import { getProjectUrl } from '../utils/url';
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
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const liveUrl = getProjectUrl(project);

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!liveUrl || liveUrl === '#') return;
    navigator.clipboard.writeText(liveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

        {/* Port & Routing Bus Strip */}
        <div className="mt-3 bg-rack-bg border border-rack-border p-2.5 space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-trace-dim">SOCKET PORT:</span>
            <span className="font-bold text-signal-amber font-mono">
              {project.port ? `:${project.port}` : 'UNBOUND'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-trace-dim">LAN ADDR:</span>
            {project.port ? (
              <div className="flex items-center gap-1.5 min-w-0">
                <a
                  href={liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-trace-silver hover:text-signal-amber hover:underline truncate max-w-[150px]"
                >
                  {liveUrl}
                </a>
                <button
                  onClick={handleCopyUrl}
                  className="text-trace-dim hover:text-signal-amber"
                  title="Copy LAN Address"
                  aria-label="Copy LAN Address"
                >
                  {copied ? <Check className="h-3 w-3 text-signal-amber" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            ) : (
              <span className="text-trace-subtle">N/A</span>
            )}
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
