import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 font-mono select-none">
      <div className="rack-blade p-8 border-2 border-breaker-red bg-rack-panel max-w-md w-full space-y-4 shadow-2xl text-left">
        <div className="flex items-center justify-between border-b border-rack-border pb-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 bg-breaker-red filament-amber"></span>
            <span className="font-display font-black text-sm text-trace-silver uppercase tracking-wider">
              [ 404 ROUTE DISCONNECTED ]
            </span>
          </div>
          <span className="bg-breaker-red/10 border border-breaker-red text-breaker-red px-1.5 py-0.2 text-[10px] font-bold">
            FAULT
          </span>
        </div>

        <div className="space-y-2 text-xs text-trace-dim">
          <p className="text-trace-silver font-bold">
            The requested control bus route does not exist or has been unmapped from the switchboard.
          </p>
          <p className="text-[10px] text-trace-dim">
            BUS ERROR CODE: ERR_SWITCHBOARD_ROUTE_UNBOUND
          </p>
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-rack-border">
          <button
            onClick={() => navigate(-1)}
            className="btn-rack flex items-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>RETURN</span>
          </button>

          <Link
            to="/"
            className="btn-rack btn-rack-primary flex items-center gap-1.5"
          >
            <Home className="h-3.5 w-3.5" />
            <span>SWITCHBOARD MAIN</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
