import React, { useState, useEffect } from 'react';
import { Plus, Search, RefreshCw, Server } from 'lucide-react';
import { api } from '../services/api';
import { Project } from '../types';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectModal } from '../components/ProjectModal';
import { useLanguage } from '../context/LanguageContext';

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [runtimeFilter, setRuntimeFilter] = useState<'ALL' | 'STATIC' | 'PHP'>('ALL');
  const { t } = useLanguage();

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects');
      setProjects(res.data.projects);
    } catch (err: any) {
      console.error('Failed to load projects:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleStart = async (id: string) => {
    try {
      await api.post(`/projects/${id}/start`);
      loadProjects();
    } catch (err: any) {
      alert(`Start failed: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleStop = async (id: string) => {
    try {
      await api.post(`/projects/${id}/stop`);
      loadProjects();
    } catch (err: any) {
      alert(`Stop failed: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleRestart = async (id: string) => {
    try {
      await api.post(`/projects/${id}/restart`);
      loadProjects();
    } catch (err: any) {
      alert(`Restart failed: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDelete = async (project: Project) => {
    if (!window.confirm(`${t.deleteConfirm} (${project.name})`)) return;
    try {
      await api.delete(`/projects/${project.id}`);
      loadProjects();
    } catch (err: any) {
      alert(`Delete failed: ${err.response?.data?.error || err.message}`);
    }
  };

  const filteredProjects = projects.filter(p => {
    if (runtimeFilter !== 'ALL' && p.runtimeType !== runtimeFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return p.name.toLowerCase().includes(s) || p.slug.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div className="space-y-5 font-mono text-xs select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rack-border pb-3">
        <div>
          <h1 className="font-display font-black text-xl tracking-wider text-trace-silver uppercase">
            [ CONTAINER INVENTORY RACK ]
          </h1>
          <p className="text-trace-dim text-xs mt-0.5">
            ISOLATED CONTAINER WORKLOADS WITH ATOMIC HOST TCP BINDINGS
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
            onClick={loadProjects}
            className="btn-rack p-2"
            title="Refresh"
            aria-label="Refresh Projects"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-rack-panel p-2.5 border border-rack-border">
        <div className="flex items-center bg-rack-bg border border-rack-border p-0.5">
          {[
            { key: 'ALL', label: 'ALL ARCHITECTURES' },
            { key: 'STATIC', label: 'STATIC ONLY' },
            { key: 'PHP', label: 'PHP RUNTIME' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setRuntimeFilter(key as any)}
              className={`px-3 py-1 text-[10px] font-bold uppercase transition ${
                runtimeFilter === key
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
            placeholder="Filter unit by name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 sm:w-64 border border-rack-border bg-rack-bg px-3 py-1.5 text-xs text-trace-silver placeholder-trace-subtle font-mono focus:border-signal-amber focus:outline-none"
          />
        </div>
      </div>

      {/* Grid */}
      {loading && projects.length === 0 ? (
        <div className="flex items-center justify-center p-16 border border-rack-border bg-rack-panel">
          <RefreshCw className="h-6 w-6 animate-spin text-signal-amber" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="border border-dashed border-rack-border bg-rack-panel p-12 text-center text-trace-dim space-y-2">
          <Server className="mx-auto h-8 w-8 text-trace-subtle" />
          <h3 className="font-display font-bold text-sm text-trace-silver uppercase">NO MATCHING CONTAINER BLADES</h3>
          <p className="text-[11px] max-w-sm mx-auto">
            {search ? 'Try adjusting your search filter.' : 'Initialize your first container blade.'}
          </p>
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

      <ProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => loadProjects()}
      />
    </div>
  );
};
