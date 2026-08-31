import React, { useState } from 'react';
import { X, Server, Database, Check } from 'lucide-react';
import { api } from '../services/api';
import { Project } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: Project) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [runtimeType, setRuntimeType] = useState<'STATIC' | 'PHP'>('STATIC');
  const [template, setTemplate] = useState('');
  const [createDatabase, setCreateDatabase] = useState(false);
  const [databaseEngine, setDatabaseEngine] = useState<'POSTGRESQL' | 'MYSQL'>('POSTGRESQL');
  const [documentRoot, setDocumentRoot] = useState('/');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Unit name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/projects', {
        name: name.trim(),
        runtimeType,
        template: template || undefined,
        createDatabase,
        databaseEngine: createDatabase ? databaseEngine : undefined,
        documentRoot: documentRoot.trim() || '/'
      });

      onSuccess(res.data.project);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to provision container');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/85 p-3 sm:p-4 pt-6 sm:pt-10 pb-8 backdrop-blur-sm select-none font-mono text-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg flex flex-col border-2 border-signal-amber bg-rack-panel shadow-2xl overflow-hidden my-0 max-h-[calc(100vh-3rem)]">
        {/* Pinned Stamped Header */}
        <div className="flex items-center justify-between border-b border-rack-border px-5 py-3.5 shrink-0 bg-rack-bg">
          <div className="flex items-center gap-2.5">
            <div className="h-3 w-3 bg-signal-amber filament-amber"></div>
            <div>
              <h2 className="font-display font-black text-sm text-trace-silver tracking-wider uppercase">
                [ PROVISION CONTAINER UNIT ]
              </h2>
              <p className="text-[10px] text-trace-dim font-mono">
                ALLOCATES ISOLATED WORKSPACE + DYNAMIC PORT
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-trace-dim hover:text-signal-amber border border-rack-border bg-rack-panel"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-5 py-4 overflow-y-auto space-y-3.5 flex-1">
            {error && (
              <div className="border border-breaker-red bg-breaker-red/10 p-2.5 text-breaker-red font-bold text-[11px]">
                FAULT: {error}
              </div>
            )}

            {/* Project Name */}
            <div>
              <label className="block text-[11px] font-bold text-trace-silver uppercase tracking-wider mb-1">
                Unit Identifier Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. cyber-portal or landing-page"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-rack-border bg-rack-bg px-3 py-2 text-trace-silver placeholder-trace-subtle font-mono text-xs focus:border-signal-amber focus:outline-none"
              />
              <span className="text-[10px] text-trace-dim mt-0.5 block">
                Alphanumeric slug will be generated automatically.
              </span>
            </div>

            {/* Runtime Environment Selector */}
            <div>
              <label className="block text-[11px] font-bold text-trace-silver uppercase tracking-wider mb-1">
                Runtime Stack Architecture
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRuntimeType('STATIC')}
                  className={`p-3 text-left border transition ${
                    runtimeType === 'STATIC'
                      ? 'border-signal-amber bg-rack-bg text-signal-amber'
                      : 'border-rack-border bg-rack-bg text-trace-dim hover:border-trace-dim'
                  }`}
                >
                  <div className="font-display font-bold text-xs">STATIC WEB</div>
                  <div className="text-[10px] text-trace-dim mt-0.5">Nginx Alpine HTTP (HTML/JS/CSS)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRuntimeType('PHP')}
                  className={`p-3 text-left border transition ${
                    runtimeType === 'PHP'
                      ? 'border-signal-amber bg-rack-bg text-signal-amber'
                      : 'border-rack-border bg-rack-bg text-trace-dim hover:border-trace-dim'
                  }`}
                >
                  <div className="font-display font-bold text-xs">PHP RUNTIME</div>
                  <div className="text-[10px] text-trace-dim mt-0.5">PHP 8.2 + Apache Engine + PDO</div>
                </button>
              </div>
            </div>

            {/* Starter Template */}
            <div>
              <label className="block text-[11px] font-bold text-trace-silver uppercase tracking-wider mb-1">
                Initial Boilerplate Template
              </label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full border border-rack-border bg-rack-bg px-3 py-2 text-trace-silver font-mono text-xs focus:border-signal-amber focus:outline-none"
              >
                <option value="">Blank Workspace (Empty Webroot)</option>
                {runtimeType === 'STATIC' ? (
                  <>
                    <option value="basic-html">Production HTML5 Starter</option>
                    <option value="tailwind-cdn">Tailwind CSS Starter Deck</option>
                  </>
                ) : (
                  <>
                    <option value="basic-php">PHP 8.2 Info & Health Probe</option>
                    <option value="php-mariadb">PHP MariaDB / MySQL Connection</option>
                  </>
                )}
              </select>
            </div>

            {/* Document Root */}
            <div>
              <label className="block text-[11px] font-bold text-trace-silver uppercase tracking-wider mb-1">
                Document Webroot Directory
              </label>
              <input
                type="text"
                value={documentRoot}
                onChange={(e) => setDocumentRoot(e.target.value)}
                placeholder="/"
                className="w-full border border-rack-border bg-rack-bg px-3 py-2 text-trace-silver font-mono text-xs focus:border-signal-amber focus:outline-none"
              />
              <span className="text-[10px] text-trace-dim mt-0.5 block">
                Default: <code className="text-signal-amber">/</code> (e.g. use <code className="text-signal-amber">/dist</code> or <code className="text-signal-amber">/public</code> if building frameworks).
              </span>
            </div>

            {/* Database Provisioning Option */}
            <div className="border border-rack-border bg-rack-bg p-3 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createDatabase}
                  onChange={(e) => setCreateDatabase(e.target.checked)}
                  className="h-4 w-4 border-rack-border text-signal-amber focus:ring-0 accent-[#ffaa00]"
                />
                <span className="font-bold text-trace-silver text-xs">
                  Attach Dedicated Database Schema
                </span>
              </label>

              {createDatabase && (
                <div className="pt-2 border-t border-rack-border/60">
                  <span className="block text-[10px] text-trace-dim uppercase mb-1">Database Engine:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDatabaseEngine('POSTGRESQL')}
                      className={`p-2 text-center border font-bold text-[11px] ${
                        databaseEngine === 'POSTGRESQL'
                          ? 'border-signal-amber bg-rack-panel text-signal-amber'
                          : 'border-rack-border text-trace-dim'
                      }`}
                    >
                      PostgreSQL
                    </button>
                    <button
                      type="button"
                      onClick={() => setDatabaseEngine('MYSQL')}
                      className={`p-2 text-center border font-bold text-[11px] ${
                        databaseEngine === 'MYSQL'
                          ? 'border-signal-amber bg-rack-panel text-signal-amber'
                          : 'border-rack-border text-trace-dim'
                      }`}
                    >
                      MariaDB / MySQL
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pinned Actuator Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-rack-border px-5 py-3 shrink-0 bg-rack-bg">
            <button
              type="button"
              onClick={onClose}
              className="btn-rack"
            >
              ABORT
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-rack btn-rack-primary flex items-center gap-1.5"
            >
              <Server className="h-3.5 w-3.5" />
              <span>{loading ? 'PROVISIONING...' : 'INITIALIZE UNIT'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
