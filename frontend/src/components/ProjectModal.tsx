import React, { useState, useEffect } from 'react';
import { X, Server, Database, Check, Globe, AlertCircle } from 'lucide-react';
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
  const [slug, setSlug] = useState('');
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [slugStatus, setSlugStatus] = useState<{ checking: boolean; available: boolean; message?: string } | null>(null);

  const [runtimeType, setRuntimeType] = useState<'STATIC' | 'PHP'>('STATIC');
  const [template, setTemplate] = useState('');
  const [createDatabase, setCreateDatabase] = useState(false);
  const [databaseEngine, setDatabaseEngine] = useState<'POSTGRESQL' | 'MYSQL'>('POSTGRESQL');
  const [documentRoot, setDocumentRoot] = useState('/');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from name if not custom
  useEffect(() => {
    if (!isCustomSlug && name) {
      const generated = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 30);
      setSlug(generated);
    }
  }, [name, isCustomSlug]);

  // Debounced check of slug availability
  useEffect(() => {
    if (!slug || slug.length < 2) {
      setSlugStatus(null);
      return;
    }

    setSlugStatus({ checking: true, available: false });
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/projects/check-slug', { params: { slug } });
        if (res.data.available) {
          setSlugStatus({ checking: false, available: true, message: `https://${slug}.multi-hosting.com is available` });
        } else {
          setSlugStatus({ checking: false, available: false, message: res.data.reason || 'Subdomain already in use' });
        }
      } catch (err: any) {
        setSlugStatus({ checking: false, available: false, message: err.response?.data?.error || 'Validation error' });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [slug]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Unit name is required');
      return;
    }

    if (slugStatus && !slugStatus.available && !slugStatus.checking) {
      setError(slugStatus.message || 'Subdomain is unavailable');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/projects', {
        name: name.trim(),
        slug: slug.trim() || undefined,
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
                ALLOCATES ISOLATED WORKSPACE + DYNAMIC SUBDOMAIN + PORT
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
            </div>

            {/* Subdomain / Slug Customization with Real-time Check */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-trace-silver uppercase tracking-wider">
                  Internet Subdomain Slug *
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomSlug(!isCustomSlug)}
                  className="text-[10px] text-signal-amber hover:underline"
                >
                  [{isCustomSlug ? 'AUTO-SYNC WITH NAME' : 'CUSTOMIZE SLUG'}]
                </button>
              </div>

              <div className="flex items-center border border-rack-border bg-rack-bg px-3 py-1.5 focus-within:border-signal-amber">
                <span className="text-trace-dim text-xs select-none">https://</span>
                <input
                  type="text"
                  required
                  placeholder="app-slug"
                  value={slug}
                  onChange={(e) => {
                    setIsCustomSlug(true);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                  }}
                  className="w-full bg-transparent px-1 text-signal-amber font-bold font-mono text-xs focus:outline-none"
                />
                <span className="text-trace-dim text-xs select-none">.multi-hosting.com</span>
              </div>

              {/* Real-time Subdomain Availability Status */}
              {slugStatus && (
                <div className="mt-1 text-[10px] flex items-center gap-1.5">
                  {slugStatus.checking ? (
                    <span className="text-trace-dim">Checking availability...</span>
                  ) : slugStatus.available ? (
                    <span className="text-signal-amber font-bold flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      <span>{slugStatus.message}</span>
                    </span>
                  ) : (
                    <span className="text-breaker-red font-bold flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      <span>{slugStatus.message}</span>
                    </span>
                  )}
                </div>
              )}
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
              disabled={loading || Boolean(slugStatus && !slugStatus.available && !slugStatus.checking)}
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
