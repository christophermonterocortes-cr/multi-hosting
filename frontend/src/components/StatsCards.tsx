import React from 'react';
import { Project, PortMatrixResponse, SystemHealthMetrics } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface StatsCardsProps {
  projects: Project[];
  portMatrix?: PortMatrixResponse | null;
  health?: SystemHealthMetrics | null;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ projects, portMatrix, health }) => {
  const { t } = useLanguage();
  const totalProjects = projects.length;
  const runningProjects = projects.filter(p => p.status === 'RUNNING').length;
  const databasesCount = projects.filter(p => p.hasDatabase).length;
  const allocatedPorts = portMatrix ? portMatrix.allocatedCount : runningProjects;
  const freePorts = portMatrix ? portMatrix.freeCount : (4000 - allocatedPorts);

  const cpuLoad = health?.cpu ? Math.round(health.cpu.loadPercent) : 0;
  const memUsage = health?.memory ? Math.round(health.memory.usagePercent) : 0;

  // Render ASCII meter block
  const renderAsciiMeter = (percent: number, length = 12) => {
    const filled = Math.round((percent / 100) * length);
    const empty = Math.max(0, length - filled);
    return '█'.repeat(filled) + '░'.repeat(empty);
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 font-mono select-none">
      {/* 1. Hosted Units */}
      <div className="rack-blade p-3.5 border-rack-border bg-rack-panel space-y-2">
        <div className="flex items-center justify-between text-[10px] text-trace-dim uppercase tracking-wider border-b border-rack-border/60 pb-1">
          <span>[ 01 // RACK UNITS ]</span>
          <span className="text-signal-amber font-bold">● {runningProjects} LIVE</span>
        </div>
        <div className="flex items-baseline justify-between pt-1">
          <span className="text-2xl font-black text-trace-silver font-display">
            {totalProjects.toString().padStart(2, '0')}
          </span>
          <span className="text-[11px] text-trace-dim">
            CONTAINERS
          </span>
        </div>
        <div className="text-[10px] text-trace-dim font-mono border-t border-rack-border/60 pt-1.5 flex justify-between">
          <span>STATIC & PHP</span>
          <span className="text-signal-amber font-bold">100% ISOLATED</span>
        </div>
      </div>

      {/* 2. Port Bus */}
      <div className="rack-blade p-3.5 border-rack-border bg-rack-panel space-y-2">
        <div className="flex items-center justify-between text-[10px] text-trace-dim uppercase tracking-wider border-b border-rack-border/60 pb-1">
          <span>[ 02 // PORT BUS ]</span>
          <span className="text-trace-dim font-bold">{freePorts} FREE</span>
        </div>
        <div className="flex items-baseline justify-between pt-1">
          <span className="text-2xl font-black text-signal-amber font-display">
            {allocatedPorts.toString().padStart(2, '0')}
          </span>
          <span className="text-[11px] text-trace-dim">
            BOUND PORTS
          </span>
        </div>
        <div className="text-[10px] text-trace-dim font-mono border-t border-rack-border/60 pt-1.5 flex justify-between">
          <span>RANGE:</span>
          <span className="text-trace-silver">:16000 – :20000</span>
        </div>
      </div>

      {/* 3. Databases */}
      <div className="rack-blade p-3.5 border-rack-border bg-rack-panel space-y-2">
        <div className="flex items-center justify-between text-[10px] text-trace-dim uppercase tracking-wider border-b border-rack-border/60 pb-1">
          <span>[ 03 // SQL SCHEMAS ]</span>
          <span className="text-signal-amber font-bold">PG + MARIA</span>
        </div>
        <div className="flex items-baseline justify-between pt-1">
          <span className="text-2xl font-black text-trace-silver font-display">
            {databasesCount.toString().padStart(2, '0')}
          </span>
          <span className="text-[11px] text-trace-dim">
            ACTIVE DBs
          </span>
        </div>
        <div className="text-[10px] text-trace-dim font-mono border-t border-rack-border/60 pt-1.5 flex justify-between">
          <span>ACCESS:</span>
          <span className="text-trace-silver">SCOPED USERS</span>
        </div>
      </div>

      {/* 4. Hardware Load */}
      <div className="rack-blade p-3.5 border-rack-border bg-rack-panel space-y-2">
        <div className="flex items-center justify-between text-[10px] text-trace-dim uppercase tracking-wider border-b border-rack-border/60 pb-1">
          <span>[ 04 // BUS TELEMETRY ]</span>
          <span className="text-signal-amber font-bold">CPU: {cpuLoad}%</span>
        </div>
        <div className="flex items-baseline justify-between pt-1">
          <span className="text-2xl font-black text-trace-silver font-display">
            {memUsage}%
          </span>
          <span className="text-[11px] text-trace-dim">
            RAM LOAD
          </span>
        </div>
        <div className="text-[10px] text-signal-amber font-mono border-t border-rack-border/60 pt-1.5 flex justify-between tracking-tight">
          <span>[{renderAsciiMeter(memUsage, 10)}]</span>
          <span className="text-trace-silver">SYS HEALTH</span>
        </div>
      </div>
    </div>
  );
};
