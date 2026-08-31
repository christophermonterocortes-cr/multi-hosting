import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Server, Database, RefreshCw, Clock } from 'lucide-react';
import { api } from '../services/api';
import { SystemHealthMetrics } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const SystemHealth: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  const loadHealth = async () => {
    setLoading(true);
    try {
      const res = await api.get('/system/health');
      setHealth(res.data);
    } catch (err: any) {
      console.error('Failed to load system health:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
    const timer = setInterval(loadHealth, 5000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}D ${h}H ${m}M ${s}S`;
  };

  const renderAsciiMeter = (percent: number, length = 16) => {
    const filled = Math.round((percent / 100) * length);
    const empty = Math.max(0, length - filled);
    return '█'.repeat(filled) + '░'.repeat(empty);
  };

  return (
    <div className="space-y-5 font-mono text-xs select-none">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rack-border pb-3">
        <div>
          <h1 className="font-display font-black text-xl tracking-wider text-trace-silver uppercase flex items-center gap-2">
            [ HOST HARDWARE DIAGNOSTICS ]
          </h1>
          <p className="text-trace-dim text-xs mt-0.5">
            5-SECOND CONTINUOUS TELEMETRY POLLING OF COMPUTE, STORAGE, AND DAEMON STATES
          </p>
        </div>

        <button
          onClick={loadHealth}
          className="btn-rack flex items-center gap-1.5"
          aria-label="Refresh telemetry"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>FORCE PROBE</span>
        </button>
      </div>

      {health ? (
        <div className="space-y-4">
          {/* Services Status Racks */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rack-blade p-3.5 border-rack-border bg-rack-panel space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-trace-dim uppercase">
                <span>[ DOCKER DAEMON ]</span>
                <Server className="h-3.5 w-3.5 text-signal-amber" />
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <span className={`h-2 w-2 rounded-full ${health.docker.available ? 'bg-signal-amber filament-amber' : 'bg-breaker-red'}`}></span>
                <span className="font-display font-bold text-sm text-trace-silver">
                  {health.docker.available ? 'OPERATIONAL' : 'FAULT'}
                </span>
              </div>
              <p className="text-[10px] text-trace-dim font-mono truncate">
                {health.docker.version || 'ENGINE ACTIVE'}
              </p>
            </div>

            <div className="rack-blade p-3.5 border-rack-border bg-rack-panel space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-trace-dim uppercase">
                <span>[ PRISMA SQL ENGINE ]</span>
                <Database className="h-3.5 w-3.5 text-signal-amber" />
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <span className={`h-2 w-2 rounded-full ${health.controlPlaneDb.connected ? 'bg-signal-amber filament-amber' : 'bg-breaker-red'}`}></span>
                <span className="font-display font-bold text-sm text-trace-silver">
                  {health.controlPlaneDb.connected ? 'WAL MODE SYNCED' : 'DISCONNECTED'}
                </span>
              </div>
              <p className="text-[10px] text-trace-dim">
                SQLITE TRANSACTIONS ACTIVE
              </p>
            </div>

            <div className="rack-blade p-3.5 border-rack-border bg-rack-panel space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-trace-dim uppercase">
                <span>[ ALLOCATED PORTS ]</span>
                <span className="text-signal-amber font-bold">:16000+</span>
              </div>
              <div className="pt-1">
                <span className="font-display font-bold text-xl text-signal-amber">
                  {health.controlPlaneDb.allocatedPorts}
                </span>
                <span className="text-trace-dim text-[11px] ml-1">ASSIGNED</span>
              </div>
              <p className="text-[10px] text-trace-dim">
                TCP ATOMIC LOCK POOL
              </p>
            </div>

            <div className="rack-blade p-3.5 border-rack-border bg-rack-panel space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-trace-dim uppercase">
                <span>[ HOST UPTIME ]</span>
                <Clock className="h-3.5 w-3.5 text-signal-amber" />
              </div>
              <div className="pt-1 font-display font-bold text-sm text-trace-silver">
                {formatUptime(health.uptimeSeconds)}
              </div>
              <p className="text-[10px] text-trace-dim">
                DAEMON ONLINE CONTINUOUS
              </p>
            </div>
          </div>

          {/* Resource Usage Gauges */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* CPU Load */}
            <div className="rack-blade p-4 border-rack-border bg-rack-panel space-y-3">
              <div className="flex items-center justify-between border-b border-rack-border pb-2">
                <span className="font-display font-bold text-xs uppercase tracking-wider text-trace-silver">
                  [ CPU UTILIZATION ]
                </span>
                <span className="text-signal-amber font-bold">{health.cpu.loadPercent}%</span>
              </div>
              <div className="text-2xl font-display font-black text-trace-silver">
                {health.cpu.loadPercent}%
              </div>
              <p className="text-[10px] text-trace-dim">
                {health.cpu.cores} PHYSICAL CORES ({health.cpu.model})
              </p>
              <div className="text-signal-amber text-xs tracking-tight border-t border-rack-border/60 pt-2 font-mono">
                [{renderAsciiMeter(health.cpu.loadPercent, 18)}]
              </div>
            </div>

            {/* Memory Usage */}
            <div className="rack-blade p-4 border-rack-border bg-rack-panel space-y-3">
              <div className="flex items-center justify-between border-b border-rack-border pb-2">
                <span className="font-display font-bold text-xs uppercase tracking-wider text-trace-silver">
                  [ RAM UTILIZATION ]
                </span>
                <span className="text-signal-amber font-bold">{health.memory.usagePercent}%</span>
              </div>
              <div className="text-2xl font-display font-black text-trace-silver">
                {health.memory.usagePercent}%
              </div>
              <p className="text-[10px] text-trace-dim">
                {health.memory.usedMb} MB ALLOCATED / {health.memory.totalMb} MB TOTAL
              </p>
              <div className="text-signal-amber text-xs tracking-tight border-t border-rack-border/60 pt-2 font-mono">
                [{renderAsciiMeter(health.memory.usagePercent, 18)}]
              </div>
            </div>

            {/* Storage Usage */}
            <div className="rack-blade p-4 border-rack-border bg-rack-panel space-y-3">
              <div className="flex items-center justify-between border-b border-rack-border pb-2">
                <span className="font-display font-bold text-xs uppercase tracking-wider text-trace-silver">
                  [ DISK POOL CAPACITY ]
                </span>
                <span className="text-signal-amber font-bold">{health.disk.usagePercent}%</span>
              </div>
              <div className="text-2xl font-display font-black text-trace-silver">
                {health.disk.usagePercent}%
              </div>
              <p className="text-[10px] text-trace-dim">
                {health.disk.usedGb} GB USED / {health.disk.totalGb} GB POOL (/mnt/DISK_MAC)
              </p>
              <div className="text-signal-amber text-xs tracking-tight border-t border-rack-border/60 pt-2 font-mono">
                [{renderAsciiMeter(health.disk.usagePercent, 18)}]
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center py-20 border border-rack-border bg-rack-panel">
          <RefreshCw className="h-6 w-6 animate-spin text-signal-amber" />
        </div>
      )}
    </div>
  );
};
