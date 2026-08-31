import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  RotateCw, 
  Download, 
  Terminal, 
  Code, 
  FileCode,
  Trash2,
  Lock
} from 'lucide-react';
import { api } from '../services/api';
import { DatabaseCredentials } from '../types';

interface DatabaseCardProps {
  projectId: string;
  onDeleted?: () => void;
}

export const DatabaseCard: React.FC<DatabaseCardProps> = ({ projectId, onDeleted }) => {
  const [credentials, setCredentials] = useState<DatabaseCredentials | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealing, setRevealing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeSnippet, setActiveSnippet] = useState<'cli' | 'pdo' | 'env'>('pdo');
  const [regenerating, setRegenerating] = useState(false);

  const loadCredentials = async (reveal = false) => {
    setLoading(true);
    try {
      const res = await api.get(`/projects/${projectId}/database`, {
        params: { revealPassword: reveal }
      });
      setCredentials(res.data.database);
    } catch {
      setCredentials(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCredentials(false);
  }, [projectId]);

  const handleTogglePassword = async () => {
    if (!showPassword && (!credentials?.password || credentials.password.includes('•'))) {
      setRevealing(true);
      await loadCredentials(true);
      setRevealing(false);
    }
    setShowPassword(!showPassword);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRegeneratePassword = async () => {
    if (!window.confirm('WARNING: Regenerating database password will require updating all active client configs. Proceed?')) return;
    setRegenerating(true);
    try {
      const res = await api.post(`/projects/${projectId}/database/regenerate-password`);
      setCredentials(res.data.database);
      setShowPassword(true);
      alert('Database password regenerated successfully.');
    } catch (err: any) {
      alert(`Failed to regenerate password: ${err.response?.data?.error || err.message}`);
    } finally {
      setRegenerating(false);
    }
  };

  const handleDownloadEnv = () => {
    if (!credentials) return;
    const blob = new Blob([credentials.envConfig], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `.env.${credentials.dbName}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteDatabase = async () => {
    if (!window.confirm('DANGER: Permanently wipe this database schema and all associated tables?')) return;
    try {
      await api.delete(`/projects/${projectId}/database`);
      setCredentials(null);
      if (onDeleted) onDeleted();
    } catch (err: any) {
      alert(`Failed to delete database: ${err.response?.data?.error || err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 border border-rack-border bg-rack-panel">
        <RotateCw className="h-6 w-6 animate-spin text-signal-amber" />
      </div>
    );
  }

  if (!credentials) {
    return (
      <div className="border border-dashed border-rack-border bg-rack-panel p-12 text-center text-trace-dim font-mono space-y-2">
        <Database className="mx-auto h-10 w-10 text-trace-subtle" />
        <h3 className="font-display font-bold text-sm text-trace-silver uppercase">NO DATABASE ATTACHED</h3>
        <p className="text-[11px] max-w-sm mx-auto">
          This unit does not currently have an isolated database attached.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-mono text-xs select-none">
      {/* Credentials Overview Card */}
      <div className="rack-blade p-4 sm:p-5 border-rack-border bg-rack-panel space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rack-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="h-3 w-3 bg-signal-amber filament-amber"></div>
            <div>
              <h3 className="font-display font-bold text-sm text-trace-silver uppercase">
                [ ENGINE: {credentials.engine === 'POSTGRESQL' ? 'POSTGRESQL' : 'MARIADB / MYSQL'} ]
              </h3>
              <p className="text-[10px] text-trace-dim">
                SCHEMA: <strong className="text-signal-amber">{credentials.dbName}</strong> (ISOLATED ROLE)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadEnv}
              className="btn-rack flex items-center gap-1"
              title="Download .env file"
            >
              <Download className="h-3.5 w-3.5" />
              <span>.ENV FILE</span>
            </button>

            <button
              onClick={handleRegeneratePassword}
              disabled={regenerating}
              className="btn-rack flex items-center gap-1 text-signal-amber"
              title="Reset Password"
            >
              <RotateCw className={`h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`} />
              <span>REKEY</span>
            </button>

            <button
              onClick={handleDeleteDatabase}
              className="btn-rack btn-rack-danger p-1.5"
              title="Wipe Database"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-rack-bg border border-rack-border p-2.5">
            <span className="text-[10px] font-bold text-trace-dim uppercase">DB HOST</span>
            <div className="mt-1 flex items-center justify-between text-trace-silver font-bold">
              <span>{credentials.host}</span>
              <button onClick={() => handleCopy(credentials.host, 'host')} className="text-trace-dim hover:text-signal-amber">
                {copiedKey === 'host' ? <Check className="h-3.5 w-3.5 text-signal-amber" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="bg-rack-bg border border-rack-border p-2.5">
            <span className="text-[10px] font-bold text-trace-dim uppercase">DB PORT</span>
            <div className="mt-1 flex items-center justify-between text-trace-silver font-bold">
              <span>{credentials.port}</span>
              <button onClick={() => handleCopy(credentials.port.toString(), 'port')} className="text-trace-dim hover:text-signal-amber">
                {copiedKey === 'port' ? <Check className="h-3.5 w-3.5 text-signal-amber" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="bg-rack-bg border border-rack-border p-2.5">
            <span className="text-[10px] font-bold text-trace-dim uppercase">DATABASE NAME</span>
            <div className="mt-1 flex items-center justify-between text-trace-silver font-bold">
              <span>{credentials.dbName}</span>
              <button onClick={() => handleCopy(credentials.dbName, 'name')} className="text-trace-dim hover:text-signal-amber">
                {copiedKey === 'name' ? <Check className="h-3.5 w-3.5 text-signal-amber" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="bg-rack-bg border border-rack-border p-2.5">
            <span className="text-[10px] font-bold text-trace-dim uppercase">USER ACCOUNT</span>
            <div className="mt-1 flex items-center justify-between text-trace-silver font-bold">
              <span>{credentials.dbUser}</span>
              <button onClick={() => handleCopy(credentials.dbUser, 'user')} className="text-trace-dim hover:text-signal-amber">
                {copiedKey === 'user' ? <Check className="h-3.5 w-3.5 text-signal-amber" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="sm:col-span-2 bg-rack-bg border border-rack-border p-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-trace-dim uppercase">SECRET KEY (AES-256)</span>
              <button 
                onClick={handleTogglePassword}
                className="text-[10px] font-bold text-signal-amber hover:underline"
              >
                [{showPassword ? 'CONCEAL' : 'REVEAL'}]
              </button>
            </div>
            <div className="mt-1 flex items-center justify-between text-trace-silver font-bold">
              <span className="truncate max-w-[280px] sm:max-w-md">{showPassword ? (credentials.password || '••••••••••••••••') : '••••••••••••••••'}</span>
              {showPassword && credentials.password && (
                <button onClick={() => handleCopy(credentials.password!, 'pass')} className="text-trace-dim hover:text-signal-amber">
                  {copiedKey === 'pass' ? <Check className="h-3.5 w-3.5 text-signal-amber" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Code Snippets Card */}
      <div className="rack-blade p-4 sm:p-5 border-rack-border bg-rack-panel space-y-3">
        <div className="flex items-center justify-between border-b border-rack-border pb-2.5">
          <h4 className="font-display font-bold text-xs uppercase tracking-wider text-trace-silver">
            [ CONNECTION CODES & DRIVERS ]
          </h4>
          <div className="flex items-center gap-1 bg-rack-bg border border-rack-border p-0.5">
            {(['pdo', 'cli', 'env'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setActiveSnippet(mode)}
                className={`px-2.5 py-0.5 text-[10px] font-bold uppercase transition ${
                  activeSnippet === mode
                    ? 'bg-signal-amber text-rack-bg font-extrabold'
                    : 'text-trace-dim hover:text-trace-silver'
                }`}
              >
                {mode === 'pdo' ? 'PHP PDO' : mode.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => {
              const text = activeSnippet === 'pdo' ? credentials.pdoExample : activeSnippet === 'cli' ? credentials.cliExample : credentials.envConfig;
              handleCopy(text, 'snippet');
            }}
            className="btn-rack absolute top-2 right-2 flex items-center gap-1 text-[10px]"
            title="Copy snippet"
          >
            {copiedKey === 'snippet' ? <Check className="h-3 w-3 text-signal-amber" /> : <Copy className="h-3 w-3" />}
            <span>COPY</span>
          </button>
          <pre className="bg-[#0b0d10] p-4 font-mono text-xs text-trace-silver overflow-x-auto leading-relaxed border border-rack-border select-text">
            {activeSnippet === 'pdo' && credentials.pdoExample}
            {activeSnippet === 'cli' && credentials.cliExample}
            {activeSnippet === 'env' && credentials.envConfig}
          </pre>
        </div>
      </div>
    </div>
  );
};
