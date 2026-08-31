import React, { useState, useEffect } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { api } from '../services/api';
import { AuditLogEntry } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const { t } = useLanguage();

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit-logs', {
        params: { limit: 50, filter: filter.trim() || undefined }
      });
      setLogs(res.data.logs);
      setTotal(res.data.total);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const getActionColor = (action: string) => {
    if (action.includes('DELETE')) return 'border-breaker-red text-breaker-red bg-breaker-red/10';
    if (action.includes('CREATE') || action.includes('PROVISION')) return 'border-signal-amber text-signal-amber bg-signal-amber/10';
    if (action.includes('LOCK') || action.includes('FAILED')) return 'border-trace-silver text-trace-silver bg-rack-subtle';
    return 'border-rack-border text-trace-dim bg-rack-bg';
  };

  return (
    <div className="space-y-5 font-mono text-xs select-none">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rack-border pb-3">
        <div>
          <h1 className="font-display font-black text-xl tracking-wider text-trace-silver uppercase flex items-center gap-2">
            [ SECURITY FLIGHT RECORDER ]
          </h1>
          <p className="text-trace-dim text-xs mt-0.5">
            IMMUTABLE CHRONOLOGICAL AUDIT TRAIL OF SYSTEM ACTIONS WITH SECRET REDACTION
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Filter by action keyword..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadLogs()}
              className="w-56 sm:w-64 border border-rack-border bg-rack-bg px-3 py-1.5 text-xs text-trace-silver placeholder-trace-subtle font-mono focus:border-signal-amber focus:outline-none"
            />
          </div>

          <button
            onClick={loadLogs}
            className="btn-rack p-2"
            title="Refresh Logs"
            aria-label="Refresh Audit Logs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="rack-blade border-rack-border bg-rack-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-rack-border bg-rack-bg text-[10px] font-bold uppercase tracking-wider text-trace-dim">
              <tr>
                <th className="px-4 py-2.5">TIMESTAMP</th>
                <th className="px-4 py-2.5">OPERATOR</th>
                <th className="px-4 py-2.5">ACTION EVENT</th>
                <th className="px-4 py-2.5">RESOURCE TARGET</th>
                <th className="px-4 py-2.5">CLIENT IP</th>
                <th className="px-4 py-2.5">PAYLOAD DETAILS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rack-border font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-trace-dim">
                    <RefreshCw className="inline h-5 w-5 animate-spin text-signal-amber mr-2" />
                    STREAMING AUDIT LOGS...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-trace-dim">
                    NO RECORDED AUDIT EVENTS FOUND.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-rack-subtle transition">
                    <td className="px-4 py-2.5 text-trace-dim">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 font-bold text-trace-silver">
                      {log.username || 'SYSTEM'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-trace-dim">
                      {log.resourceType} {log.resourceId ? `(${log.resourceId.substring(0, 8)})` : ''}
                    </td>
                    <td className="px-4 py-2.5 text-trace-dim">
                      {log.ipAddress || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-trace-silver max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
