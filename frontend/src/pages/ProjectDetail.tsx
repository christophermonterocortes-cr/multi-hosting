import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Globe, 
  Play, 
  Square, 
  RotateCw, 
  FolderTree, 
  Database, 
  Terminal, 
  ExternalLink, 
  Trash2, 
  Settings as SettingsIcon,
  ArrowLeft,
  HardDrive,
  Cpu,
  Server
} from 'lucide-react';
import { api } from '../services/api';
import { Project, ContainerStats } from '../types';
import { FileManager } from '../components/FileManager';
import { DatabaseCard } from '../components/DatabaseCard';
import { LogViewer } from '../components/LogViewer';
import { getProjectUrl } from '../utils/url';
import { useLanguage } from '../context/LanguageContext';

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const activeTab = (searchParams.get('tab') as 'overview' | 'files' | 'database' | 'logs' | 'settings') || 'overview';
  
  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<ContainerStats | null>(null);
  const [storageMb, setStorageMb] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const liveUrl = project ? getProjectUrl(project) : '';

  // Settings tab form state
  const [editName, setEditName] = useState('');
  const [editDomain, setEditDomain] = useState('');
  const [editDocRoot, setEditDocRoot] = useState('/');
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  const loadProject = async () => {
    if (!id) return;
    try {
      const [projRes, statsRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/stats`).catch(() => ({ data: { stats: null, storageMb: 0 } }))
      ]);
      const p = projRes.data.project;
      setProject(p);
      setEditName(p.name);
      setEditDomain(p.domain || '');
      setEditDocRoot(p.documentRoot || '/');
      if (statsRes.data.stats) setStats(statsRes.data.stats);
      if (statsRes.data.storageMb) setStorageMb(statsRes.data.storageMb);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [id]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSavingSettings(true);
    setSettingsMessage(null);
    try {
      await api.put(`/projects/${id}`, {
        name: editName,
        domain: editDomain.trim() || null,
        documentRoot: editDocRoot.trim() || '/'
      });
      setSettingsMessage('Settings updated successfully!');
      loadProject();
      setTimeout(() => setSettingsMessage(null), 4000);
    } catch (err: any) {
      alert(`Failed to save settings: ${err.response?.data?.error || err.message}`);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleStart = async () => {
    if (!id) return;
    try {
      await api.post(`/projects/${id}/start`);
      loadProject();
    } catch (err: any) {
      alert(`Start failed: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleStop = async () => {
    if (!id) return;
    try {
      await api.post(`/projects/${id}/stop`);
      loadProject();
    } catch (err: any) {
      alert(`Stop failed: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleRestart = async () => {
    if (!id) return;
    try {
      await api.post(`/projects/${id}/restart`);
      loadProject();
    } catch (err: any) {
      alert(`Restart failed: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDelete = async () => {
    if (!project || !id) return;
    if (!window.confirm(`${t.deleteConfirm} (${project.name})`)) return;
    try {
      await api.delete(`/projects/${id}`);
      navigate('/projects');
    } catch (err: any) {
      alert(`Delete failed: ${err.response?.data?.error || err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-24 border border-rack-border bg-rack-panel">
        <RotateCw className="h-6 w-6 animate-spin text-signal-amber" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="border border-breaker-red bg-breaker-red/10 p-8 text-center text-breaker-red font-mono space-y-3">
        <p className="font-bold text-sm">FAULT: {error || 'Unit blade not found.'}</p>
        <button
          onClick={() => navigate('/projects')}
          className="btn-rack inline-block"
        >
          RETURN TO INVENTORY
        </button>
      </div>
    );
  }

  const isRunning = project.status === 'RUNNING';

  return (
    <div className="space-y-5 font-mono text-xs select-none">
      {/* 1U Chassis Headplate */}
      <div className="rack-blade p-4 border-rack-border bg-rack-panel">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/projects')}
              className="btn-rack p-2"
              aria-label="Return to Inventory"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className={`h-2.5 w-2.5 rounded-full ${isRunning ? 'bg-signal-amber filament-amber' : 'bg-trace-subtle'}`} />
                <h1 className="font-display font-black text-lg sm:text-xl text-trace-silver uppercase">
                  UNIT: {project.name}
                </h1>
                <span className="bg-rack-bg border border-rack-border px-1.5 py-0.2 text-[10px] font-bold text-trace-silver">
                  {project.runtimeType}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 border ${
                  isRunning 
                    ? 'bg-signal-amber/10 text-signal-amber border-signal-amber/40' 
                    : 'bg-rack-bg text-trace-dim border-rack-border'
                }`}>
                  {isRunning ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-trace-dim font-mono">
                SLUG: {project.slug} • ID: {project.id}
              </p>
            </div>
          </div>

          {/* Breakers and Actuators */}
          <div className="flex items-center gap-2">
            {liveUrl && liveUrl !== '#' && (
              <a
                href={liveUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-rack btn-rack-primary flex items-center gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>OPEN LAN SITE</span>
              </a>
            )}

            {isRunning ? (
              <>
                <button
                  onClick={handleRestart}
                  className="btn-rack flex items-center gap-1"
                >
                  <RotateCw className="h-3.5 w-3.5 text-trace-dim" />
                  <span>RESTART</span>
                </button>
                <button
                  onClick={handleStop}
                  className="btn-rack text-signal-amber flex items-center gap-1"
                >
                  <Square className="h-3.5 w-3.5 fill-signal-amber" />
                  <span>STOP</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleStart}
                className="btn-rack btn-rack-primary flex items-center gap-1"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>START WORKLOAD</span>
              </button>
            )}

            <button
              onClick={handleDelete}
              className="btn-rack btn-rack-danger"
              title="Delete Unit"
              aria-label="Delete Unit"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mechanical Tabs Segmented Rail */}
      <div className="flex items-center gap-1 bg-rack-panel border border-rack-border p-1 overflow-x-auto">
        {[
          { key: 'overview', label: 'OVERVIEW', icon: Globe },
          { key: 'files', label: 'FILESYSTEM', icon: FolderTree },
          ...(project.hasDatabase ? [{ key: 'database', label: 'DATABASE', icon: Database }] : []),
          { key: 'logs', label: 'LOG STREAM', icon: Terminal },
          { key: 'settings', label: 'CONFIG', icon: SettingsIcon },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSearchParams({ tab: key })}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 font-bold uppercase transition whitespace-nowrap ${
              activeTab === key
                ? 'bg-signal-amber text-rack-bg'
                : 'text-trace-dim hover:text-trace-silver hover:bg-rack-bg'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Diagnostic Meters */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rack-blade p-3.5 border-rack-border bg-rack-panel space-y-1">
              <div className="flex items-center justify-between text-[10px] text-trace-dim uppercase">
                <span>[ RAM CONSUMPTION ]</span>
                <Cpu className="h-3.5 w-3.5 text-signal-amber" />
              </div>
              <div className="text-xl font-black text-trace-silver font-display">
                {stats?.memoryUsage || '0 MB'}
              </div>
              <p className="text-[10px] text-trace-dim">LIMIT: {stats?.memoryLimit || '256 MB'}</p>
            </div>

            <div className="rack-blade p-3.5 border-rack-border bg-rack-panel space-y-1">
              <div className="flex items-center justify-between text-[10px] text-trace-dim uppercase">
                <span>[ STORAGE FOOTPRINT ]</span>
                <HardDrive className="h-3.5 w-3.5 text-signal-amber" />
              </div>
              <div className="text-xl font-black text-trace-silver font-display">
                {storageMb ? `${storageMb.toFixed(2)} MB` : '0.00 MB'}
              </div>
              <p className="text-[10px] text-trace-dim">POOL: /mnt/DISK_MAC</p>
            </div>

            <div className="rack-blade p-3.5 border-rack-border bg-rack-panel space-y-1">
              <div className="flex items-center justify-between text-[10px] text-trace-dim uppercase">
                <span>[ CPU UTILIZATION ]</span>
                <Server className="h-3.5 w-3.5 text-signal-amber" />
              </div>
              <div className="text-xl font-black text-signal-amber font-display">
                {stats?.cpuPercent ? `${stats.cpuPercent}%` : '0.0%'}
              </div>
              <p className="text-[10px] text-trace-dim">ALLOCATION: 1.0 vCPU</p>
            </div>
          </div>

          {/* Unit Socket Bus Details */}
          <div className="rack-blade p-4 border-rack-border bg-rack-panel space-y-3">
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-trace-silver">
              [ UNIT SOCKET & ROUTING BUS ]
            </h3>
            <div className="space-y-2 text-[11px]">
              <div className="flex flex-wrap items-center justify-between border-b border-rack-border/60 pb-2">
                <span className="text-trace-dim">LAN PUBLIC SOCKET URL:</span>
                <a href={liveUrl || '#'} target="_blank" rel="noreferrer" className="text-signal-amber font-bold hover:underline">
                  {liveUrl || 'UNBOUND'}
                </a>
              </div>
              <div className="flex flex-wrap items-center justify-between border-b border-rack-border/60 pb-2">
                <span className="text-trace-dim">DOCUMENT ROOT WEBPATH:</span>
                <span className="text-trace-silver font-bold">{project.documentRoot}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between border-b border-rack-border/60 pb-2">
                <span className="text-trace-dim">PROVISIONED TIMESTAMP:</span>
                <span className="text-trace-silver">{new Date(project.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between">
                <span className="text-trace-dim">LAST REVISION:</span>
                <span className="text-trace-silver">{project.lastDeployedAt ? new Date(project.lastDeployedAt).toLocaleString() : 'INITIAL DEPLOY'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'files' && <FileManager projectId={project.id} />}

      {activeTab === 'database' && <DatabaseCard projectId={project.id} onDeleted={loadProject} />}

      {activeTab === 'logs' && <LogViewer projectId={project.id} />}

      {activeTab === 'settings' && (
        <div className="rack-blade p-5 border-rack-border bg-rack-panel space-y-4">
          <div className="border-b border-rack-border pb-3">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-trace-silver">
              [ UNIT CONFIGURATION PARAMETERS ]
            </h3>
            <p className="text-[10px] text-trace-dim mt-0.5">
              UPDATE SYSTEM IDENTIFIERS AND DOCUMENT WEBROOT MAPPINGS
            </p>
          </div>

          {settingsMessage && (
            <div className="border border-signal-amber bg-signal-amber/10 p-2.5 text-signal-amber font-bold">
              STATUS: {settingsMessage}
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-3.5 max-w-lg">
            <div>
              <label className="block text-[11px] font-bold text-trace-silver uppercase mb-1">Unit Display Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full border border-rack-border bg-rack-bg px-3 py-2 text-trace-silver text-xs focus:border-signal-amber focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-trace-silver uppercase mb-1">Custom Hostname (Optional)</label>
              <input
                type="text"
                value={editDomain}
                onChange={(e) => setEditDomain(e.target.value)}
                placeholder="unit.lan or client.internal"
                className="w-full border border-rack-border bg-rack-bg px-3 py-2 text-trace-silver text-xs focus:border-signal-amber focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-trace-silver uppercase mb-1">Document Root Webpath</label>
              <input
                type="text"
                value={editDocRoot}
                onChange={(e) => setEditDocRoot(e.target.value)}
                className="w-full border border-rack-border bg-rack-bg px-3 py-2 text-trace-silver text-xs focus:border-signal-amber focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="btn-rack btn-rack-primary"
              >
                <span>{savingSettings ? 'COMMITTING...' : 'COMMIT PARAMETERS'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
