import React, { useState, useEffect } from 'react';
import { 
  Database, 
  ExternalLink, 
  Copy, 
  Check, 
  Server, 
  RefreshCw,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { api } from '../services/api';
import { DatabaseInstance } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const PhpMyAdmin: React.FC = () => {
  const [databases, setDatabases] = useState<DatabaseInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isEmbedded, setIsEmbedded] = useState(false);
  const { t } = useLanguage();

  const pmaPort = 8080;
  const host = window.location.hostname || '192.168.0.245';
  const standaloneUrl = `http://${host}:${pmaPort}`;

  useEffect(() => {
    loadDatabases();
  }, []);

  const loadDatabases = async () => {
    setLoading(true);
    try {
      const res = await api.get('/databases');
      const mysqlDbs = (res.data.databases || []).filter(
        (db: DatabaseInstance) => db.engine === 'MYSQL'
      );
      setDatabases(mysqlDbs);
    } catch (err) {
      console.error('Failed to load databases:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-5 font-mono text-xs select-none">
      {/* Header Banner */}
      <div className="rack-blade p-4 sm:p-5 border-rack-border bg-rack-panel space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-rack-border pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-signal-amber filament-amber" />
              <h1 className="font-display font-black text-xl tracking-wider text-trace-silver uppercase">
                [ PHPMYADMIN DATABASE BRIDGE ]
              </h1>
              <span className="bg-rack-bg border border-rack-border px-1.5 py-0.2 text-[10px] font-bold text-signal-amber">
                MARIADB & MYSQL
              </span>
            </div>
            <p className="text-[11px] text-trace-dim mt-0.5">
              GRAPHICAL SQL QUERY & REPLICATION TERMINAL RUNNING ON LAN PORT {pmaPort}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEmbedded(!isEmbedded)}
              className="btn-rack flex items-center gap-1.5"
            >
              {isEmbedded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              <span>{isEmbedded ? 'COLLAPSE' : 'EMBED IN DECK'}</span>
            </button>

            <a
              href={standaloneUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-rack btn-rack-primary flex items-center gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>LAUNCH STANDALONE (:{pmaPort})</span>
            </a>
          </div>
        </div>

        {/* Embedded Iframe View */}
        {isEmbedded && (
          <div className="border-2 border-signal-amber bg-black overflow-hidden mt-3">
            <div className="flex items-center justify-between px-3 py-1.5 bg-rack-bg border-b border-rack-border text-[10px] text-trace-dim">
              <span className="text-signal-amber font-bold">URI: {standaloneUrl}</span>
              <a href={standaloneUrl} target="_blank" rel="noreferrer" className="hover:text-trace-silver flex items-center gap-1">
                <span>OPEN IN TAB</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <iframe
              src={standaloneUrl}
              title="phpMyAdmin Web Interface"
              className="w-full h-[700px] border-0"
            />
          </div>
        )}
      </div>

      {/* Server & Credentials Helper Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Connection Quick Guide */}
        <div className="rack-blade p-4 border-rack-border bg-rack-panel space-y-3">
          <div className="flex items-center space-x-2 text-trace-silver font-display font-bold text-xs uppercase tracking-wider border-b border-rack-border pb-2">
            <Server className="h-3.5 w-3.5 text-signal-amber" />
            <span>[ LOGIN PARAMETERS ]</span>
          </div>

          <div className="space-y-2 text-[11px]">
            <div className="p-2.5 bg-rack-bg border border-rack-border space-y-1">
              <span className="text-trace-dim font-bold uppercase text-[9px]">SERVER HOST (INTERNAL DOCKER)</span>
              <div className="flex items-center justify-between font-bold text-trace-silver">
                <span>mariadb-managed</span>
                <button
                  onClick={() => copyToClipboard('mariadb-managed', 'host-internal')}
                  className="text-trace-dim hover:text-signal-amber"
                  title="Copy Server Host"
                >
                  {copiedKey === 'host-internal' ? <Check className="h-3.5 w-3.5 text-signal-amber" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="p-2.5 bg-rack-bg border border-rack-border space-y-1">
              <span className="text-trace-dim font-bold uppercase text-[9px]">LAN EXTERNAL PORT</span>
              <div className="flex items-center justify-between font-bold text-trace-silver">
                <span>:3306</span>
                <button
                  onClick={() => copyToClipboard('3306', 'port-mysql')}
                  className="text-trace-dim hover:text-signal-amber"
                  title="Copy Port"
                >
                  {copiedKey === 'port-mysql' ? <Check className="h-3.5 w-3.5 text-signal-amber" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="p-2.5 bg-rack-bg border border-rack-border space-y-1">
              <span className="text-trace-dim font-bold uppercase text-[9px]">HTTP INTERFACE PORT</span>
              <div className="flex items-center justify-between font-bold text-trace-silver">
                <span>:8080</span>
                <button
                  onClick={() => copyToClipboard('8080', 'port-pma')}
                  className="text-trace-dim hover:text-signal-amber"
                  title="Copy Port"
                >
                  {copiedKey === 'port-pma' ? <Check className="h-3.5 w-3.5 text-signal-amber" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Managed Databases Table */}
        <div className="lg:col-span-2 rack-blade p-4 border-rack-border bg-rack-panel space-y-3">
          <div className="flex items-center justify-between border-b border-rack-border pb-2">
            <div>
              <h2 className="font-display font-bold text-xs uppercase tracking-wider text-trace-silver">
                [ ACTIVE MYSQL & MARIADB SCHEMAS ]
              </h2>
              <p className="text-[10px] text-trace-dim">CONFIGURED FOR DIRECT PHPMYADMIN AUTHENTICATION</p>
            </div>
            <button
              onClick={loadDatabases}
              className="btn-rack p-1.5"
              title="Refresh Databases"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-signal-amber" />
            </div>
          ) : databases.length === 0 ? (
            <div className="text-center py-8 text-trace-dim">
              <Database className="h-8 w-8 mx-auto mb-2 text-trace-subtle" />
              <p className="text-xs">No MariaDB/MySQL databases attached. Provision one from unit manager.</p>
            </div>
          ) : (
            <div className="divide-y divide-rack-border">
              {databases.map((db) => (
                <div key={db.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-trace-silver text-xs">{db.dbName}</span>
                      <span className="bg-rack-bg border border-rack-border px-1 py-0.2 text-[9px] text-signal-amber">
                        {db.engine}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-trace-dim space-x-2">
                      <span>USER: <strong className="text-trace-silver">{db.dbUser}</strong></span>
                      <span>•</span>
                      <span>PORT: <strong className="text-trace-silver">{db.port}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => copyToClipboard(db.dbName, `dbname-${db.id}`)}
                      className="btn-rack text-[10px] py-1 px-2"
                    >
                      {copiedKey === `dbname-${db.id}` ? <Check className="h-3 w-3 text-signal-amber" /> : <Copy className="h-3 w-3" />}
                      <span className="ml-1">COPY DB</span>
                    </button>
                    <button
                      onClick={() => copyToClipboard(db.dbUser, `dbuser-${db.id}`)}
                      className="btn-rack text-[10px] py-1 px-2"
                    >
                      {copiedKey === `dbuser-${db.id}` ? <Check className="h-3 w-3 text-signal-amber" /> : <Copy className="h-3 w-3" />}
                      <span className="ml-1">COPY USER</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
