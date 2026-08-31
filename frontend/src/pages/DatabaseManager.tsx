import React, { useState, useEffect } from 'react';
import { Database, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { Project } from '../types';
import { DatabaseCard } from '../components/DatabaseCard';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export const DatabaseManager: React.FC = () => {
  const [projectsWithDb, setProjectsWithDb] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects');
      const dbs = res.data.projects.filter((p: Project) => p.hasDatabase);
      setProjectsWithDb(dbs);
      if (dbs.length > 0 && !selectedProjectId) {
        setSelectedProjectId(dbs[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load databases:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div className="space-y-5 font-mono text-xs select-none">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rack-border pb-3">
        <div>
          <h1 className="font-display font-black text-xl tracking-wider text-trace-silver uppercase flex items-center gap-2">
            [ DATABASE ENGINES CONSOLE ]
          </h1>
          <p className="text-trace-dim text-xs mt-0.5">
            SCOPED POSTGRESQL & MARIADB SCHEMAS WITH ISOLATED CREDENTIALS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/phpmyadmin')}
            className="btn-rack text-signal-amber flex items-center gap-1.5"
          >
            <Database className="h-3.5 w-3.5" />
            <span>PHPMYADMIN CONTROL</span>
          </button>

          <button
            onClick={loadProjects}
            className="btn-rack p-2"
            title="Refresh"
            aria-label="Refresh Database List"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && projectsWithDb.length === 0 ? (
        <div className="flex justify-center py-20 border border-rack-border bg-rack-panel">
          <RefreshCw className="h-6 w-6 animate-spin text-signal-amber" />
        </div>
      ) : projectsWithDb.length === 0 ? (
        <div className="border border-dashed border-rack-border bg-rack-panel p-12 text-center text-trace-dim space-y-3">
          <Database className="mx-auto h-10 w-10 text-trace-subtle" />
          <h3 className="font-display font-bold text-sm text-trace-silver uppercase">NO MANAGED SCHEMAS ACTIVE</h3>
          <p className="text-[11px] max-w-sm mx-auto">
            When creating a new container unit, enable the "Attach Dedicated Database Schema" option.
          </p>
          <button
            onClick={() => navigate('/projects')}
            className="btn-rack btn-rack-primary inline-flex"
          >
            <span>GO TO INVENTORY</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {/* Project List Sidebar */}
          <div className="space-y-2 lg:col-span-1">
            <span className="text-[10px] font-bold text-trace-dim uppercase tracking-wider block border-b border-rack-border pb-1">
              ATTACHED SCHEMAS ({projectsWithDb.length})
            </span>
            <div className="space-y-1.5 mt-2">
              {projectsWithDb.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`w-full text-left p-2.5 border transition ${
                    selectedProjectId === p.id
                      ? 'border-signal-amber bg-rack-bg text-signal-amber font-bold'
                      : 'border-rack-border bg-rack-panel text-trace-dim hover:border-trace-dim'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate max-w-[130px] font-bold text-trace-silver">{p.name}</span>
                    <span className="bg-rack-bg border border-rack-border px-1 py-0.2 text-[9px] font-mono text-signal-amber uppercase">
                      {p.databaseEngine || 'PGSQL'}
                    </span>
                  </div>
                  <span className="text-[10px] text-trace-dim mt-0.5 block truncate">
                    SLUG: {p.slug}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Database Details Card */}
          <div className="lg:col-span-3">
            {selectedProjectId && (
              <DatabaseCard projectId={selectedProjectId} onDeleted={loadProjects} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
