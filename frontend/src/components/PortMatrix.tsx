import React, { useState, useEffect } from 'react';
import { Network, RefreshCw, Search } from 'lucide-react';
import { api } from '../services/api';
import { PortMatrixResponse, PortInfo } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const PortMatrix: React.FC = () => {
  const [data, setData] = useState<PortMatrixResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ALLOCATED' | 'FREE'>('ALL');
  const [search, setSearch] = useState('');
  const [reconciling, setReconciling] = useState(false);
  const { isAdmin } = useAuth();
  const { t } = useLanguage();

  const loadMatrix = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ports', { params: { limit: 120 } });
      setData(res.data);
    } catch (err: any) {
      console.error('Failed to load port matrix:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatrix();
  }, []);

  const handleReconcile = async () => {
    setReconciling(true);
    try {
      const res = await api.post('/ports/reconcile');
      alert(res.data.message);
      loadMatrix();
    } catch (err: any) {
      alert(`Reconciliation failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setReconciling(false);
    }
  };

  const filteredPorts = data?.ports.filter((p: PortInfo) => {
    if (filter === 'ALLOCATED' && p.status !== 'ALLOCATED') return false;
    if (filter === 'FREE' && p.status !== 'FREE') return false;
    if (search) {
      const s = search.toLowerCase();
      return p.port.toString().includes(s) || (p.projectName && p.projectName.toLowerCase().includes(s));
    }
    return true;
  }) || [];

  return (
    <div className="space-y-4 font-mono text-xs select-none">
      {/* Header & Stats Banner */}
      <div className="rack-blade p-4 sm:p-5 border-rack-border bg-rack-panel space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rack-border pb-3">
          <div>
            <h2 className="font-display font-black text-lg text-trace-silver flex items-center gap-2 uppercase tracking-wider">
              [ TCP PORT BUS ALLOCATOR // RANGE: 16000–20000 ]
            </h2>
            <p className="text-[11px] text-trace-dim mt-0.5">
              HARDWARE HOST SOCKET ASSIGNMENTS WITH ATOMIC ADVISORY LOCKS
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={handleReconcile}
                disabled={reconciling}
                className="btn-rack text-signal-amber flex items-center gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${reconciling ? 'animate-spin' : ''}`} />
                <span>RECONCILE BUS</span>
              </button>
            )}

            <button
              onClick={loadMatrix}
              className="btn-rack p-2"
              title="Refresh Ports"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Legend and Metrics */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-[10px]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 bg-trace-subtle border border-rack-border"></span>
              <span className="text-trace-dim">OPEN SOCKET</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 bg-signal-amber filament-amber"></span>
              <span className="text-signal-amber font-bold">BOUND TO UNIT</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 bg-trace-silver"></span>
              <span className="text-trace-dim">RESERVED PROCESS</span>
            </div>
          </div>

          {data && (
            <div className="flex items-center gap-3 text-trace-dim font-bold">
              <span className="text-trace-silver">{data.freeCount} AVAILABLE</span>
              <span>•</span>
              <span className="text-signal-amber">{data.allocatedCount} ALLOCATED</span>
              <span>•</span>
              <span>{data.total} BUS SLOTS</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-rack-panel p-2.5 border border-rack-border">
        <div className="flex items-center bg-rack-bg border border-rack-border p-0.5">
          {(['ALL', 'ALLOCATED', 'FREE'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilter(mode)}
              className={`px-3 py-1 text-[10px] font-bold uppercase transition ${
                filter === mode
                  ? 'bg-signal-amber text-rack-bg font-extrabold'
                  : 'text-trace-dim hover:text-trace-silver'
              }`}
            >
              {mode === 'ALL' ? 'ALL SOCKETS' : mode === 'ALLOCATED' ? 'BOUND ONLY' : 'FREE ONLY'}
            </button>
          ))}
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="Search port number or unit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 sm:w-64 border border-rack-border bg-rack-bg px-3 py-1 text-xs text-trace-silver placeholder-trace-subtle font-mono focus:border-signal-amber focus:outline-none"
          />
        </div>
      </div>

      {/* Visual Socket Matrix Grid */}
      <div className="rack-blade p-4 border-rack-border bg-rack-panel">
        {loading ? (
          <div className="flex justify-center py-16">
            <RefreshCw className="h-6 w-6 animate-spin text-signal-amber" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {filteredPorts.map((p) => {
              const isAllocated = p.status === 'ALLOCATED';
              const isReserved = p.status === 'RESERVED';

              return (
                <div
                  key={p.port}
                  title={isAllocated ? `Port ${p.port} -> ${p.projectName || 'Active Unit'}` : `Port ${p.port} (Open Socket)`}
                  className={`p-2.5 border text-center transition cursor-pointer ${
                    isAllocated
                      ? 'border-signal-amber bg-signal-amber/10 text-signal-amber font-bold'
                      : isReserved
                      ? 'border-trace-silver/40 bg-rack-subtle text-trace-silver font-bold'
                      : 'border-rack-border bg-rack-bg text-trace-dim hover:border-trace-dim hover:text-trace-silver'
                  }`}
                >
                  <span className="font-mono text-xs font-bold tracking-tight block">:{p.port}</span>
                  <span className="mt-0.5 text-[9px] uppercase font-bold tracking-wider opacity-80 truncate block">
                    {isAllocated ? (p.projectName || 'BOUND') : isReserved ? 'RESERVED' : 'OPEN'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
