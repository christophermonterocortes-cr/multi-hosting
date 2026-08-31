import React from 'react';
import { PortMatrix } from '../components/PortMatrix';

export const PortManager: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Port Management</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Automatic host port collision avoidance and allocation tracker
        </p>
      </div>

      <PortMatrix />
    </div>
  );
};
