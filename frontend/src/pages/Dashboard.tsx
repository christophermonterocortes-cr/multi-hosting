import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  Database, 
  FolderKanban,
  Server
} from 'lucide-react';
import { api } from '../services/api';
import { Project, PortMatrixResponse, SystemHealthMetrics } from '../types';
import { StatsCards } from '../components/StatsCards';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectModal } from '../components/ProjectModal';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [portMatrix, setPortMatrix] = useState<PortMatrixResponse | null>(null);
  const [health, setHealth] = useState<SystemHealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'STATIC' | 'PHP' | 'RUNNING'>('ALL');
  const { t } = useLanguage();
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const [projRes, portRes, healthRes] = await Promise.all([
        api.get('/projects'),
        api.get('/ports', { params: { limit: 50 } }).catch(() => ({ data: null })),
        api.get('/system/health').catch(() => ({ data: null }))
      ]);

      setProjects(projRes.data.projects);
      if (portRes.data) setPortMatrix(portRes.data);
      if (healthRes.data) setHealth(healthRes.data);
    } catch (err: any) {
      console.error('Dashboard load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStart = async (id: string) => {
    try {
      await api.post(`/projects/${id}/start`);
      loadData();
    } catch (err: any) {
      alert(`Start failed: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleStop = async (id: string) => {
    try {
      await api.post(`/projects/${id}/stop`);
      loadData();
    } catch (err: any) {
      alert(`Stop failed: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleRestart = async (id: string) => {
    try {
      await api.post(`/projects/${id}/restart`);
      loadData();
    } catch (err: any) {
      alert(`Restart failed: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDelete = async (project: Project) => {
    if (!window.confirm(`${t.deleteConfirm} (${project.name})`)) return;
    try {
      await api.delete(`/projects/${project.id}`);
      loadData();
    } catch (err: any) {
      alert(`Delete failed: ${err.response?.data?.error || err.message}`);
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filterType === 'STATIC') return p.runtimeType === 'STATIC';
    if (filterType === 'PHP') return p.runtimeType === 'PHP';
    if (filterType === 'RUNNING') return p.status === 'RUNNING';
    return true;
  });

  const lanHost = window.location.hostname || '192.168.0.245';

  return (
    <div className="space-y-6 font-mono text-xs select-none">
      {/* Industrial Stamped Main Switchboard Deck */}
      <div className="rack-blade p-5 sm:p-6 border-rack-border bg-rack-panel space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rack-border pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-signal-amber filament-amber"></span>
              <h1 className="font-display font-black text-xl sm:text-2xl tracking-wider text-trace-silver uppercase">
                [ ON-PREM CONTAINER SWITCHBOARD ]
              </h1>
            </div>
            <p className="text-trace-dim text-xs">
              LAN HOST: <strong className="text-signal-amber font-mono">{lanHost}</strong> • DOCKER ENGINE RUNTIME • TRANSACTED DATABASE
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setModalOpen(true)}
              className="btn-rack btn-rack-primary flex items-center gap-1.5 shadow-hard"
            >
              <Plus className="h-4 w-4" />
              <span>PROVISION UNIT</span>
            </button>
            <button
              onClick={() => navigate('/phpmyadmin')}
              className="btn-rack flex items-center gap-1.5"
            >
              <Database className="h-3.5 w-3.5 text-signal-amber" />
              <span>PHPMYADMIN</span>
            </button>
          </div>
        </div>

        {/* Diagnostic Bar Indicators */}
        <StatsCards projects={projects} portMatrix={portMatrix} health={health} />
      </div>

      {/* Rack Units Inventory Section */}
      <div className="space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rack-border pb-2.5">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-bold text-sm tracking-wider text-trace-silver uppercase">
              [ RACK UNITS INVENTORY ]
            </h2>
            <span className="bg-rack-bg border border-rack-border px-1.5 py-0.2 text-[10px] font-bold text-signal-amber">
              {filteredProjects.length} UNITS
            </span>
          </div>

          {/* Filters and Search Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-rack-bg border border-rack-border p-0.5">
              {[
                { key: 'ALL', label: 'ALL' },
                { key: 'RUNNING', label: 'LIVE' },
                { key: 'STATIC', label: 'STATIC' },
                { key: 'PHP', label: 'PHP' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilterType(key as any)}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase transition ${
                    filterType === key
                      ? 'bg-signal-amber text-rack-bg font-extrabold'
                      : 'text-trace-dim hover:text-trace-silver'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search unit / slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-44 sm:w-56 border border-rack-border bg-rack-bg px-2.5 py-1 text-xs text-trace-silver placeholder-trace-subtle font-mono focus:border-signal-amber focus:outline-none"
              />
            </div>

            <button
              onClick={loadData}
              className="btn-rack p-1.5"
              title="Refresh Units"
              aria-label="Refresh Data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Rack Blades Grid */}
        {loading && projects.length === 0 ? (
          <div className="flex items-center justify-center p-16 border border-rack-border bg-rack-panel">
            <RefreshCw className="h-6 w-6 animate-spin text-signal-amber" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="border border-dashed border-rack-border bg-rack-panel p-12 text-center text-trace-dim space-y-3">
            <Server className="mx-auto h-10 w-10 text-trace-subtle" />
            <h3 className="font-display font-bold text-sm text-trace-silver uppercase">NO CONTAINER UNITS ONLINE</h3>
            <p className="text-[11px] max-w-sm mx-auto">
              {search ? 'No rack units match the specified query.' : 'Initialize a new static or PHP container unit.'}
            </p>
            {!search && (
              <button
                onClick={() => setModalOpen(true)}
                className="btn-rack btn-rack-primary inline-flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>PROVISION NEW UNIT</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onStart={handleStart}
                onStop={handleStop}
                onRestart={handleRestart}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Provisioning Dialog */}
      <ProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => loadData()}
      />
    </div>
  );
};
