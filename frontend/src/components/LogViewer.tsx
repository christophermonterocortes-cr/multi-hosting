import React, { useState, useEffect, useRef } from 'react';
import { Terminal, RefreshCw, Copy, Check, Play, Pause } from 'lucide-react';
import { api } from '../services/api';

interface LogViewerProps {
  projectId: string;
}

export const LogViewer: React.FC<LogViewerProps> = ({ projectId }) => {
  const [logs, setLogs] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [copied, setCopied] = useState(false);
  const logContainerRef = useRef<HTMLPreElement>(null);

  const fetchLogs = async () => {
    try {
      const res = await api.get(`/projects/${projectId}/logs`);
      setLogs(res.data.logs || 'NO RUNTIME OUTPUT RECORDED IN BUFFER.');
    } catch (err: any) {
      setLogs(`RUNTIME LOG FAULT: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [projectId]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, projectId]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleCopy = () => {
    navigator.clipboard.writeText(logs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rack-blade border-rack-border bg-rack-panel p-4 font-mono text-xs select-none space-y-3">
      {/* Terminal Title Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rack-border pb-2.5">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-signal-amber" />
          <span className="font-display font-bold uppercase tracking-wider text-trace-silver">
            [ CONTAINER STDOUT / STDERR STREAM ]
          </span>
          {autoRefresh && (
            <span className="flex items-center gap-1 text-[10px] text-signal-amber">
              <span className="h-1.5 w-1.5 rounded-full bg-signal-amber filament-amber"></span>
              LIVE TAIL
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`btn-rack ${autoRefresh ? 'text-signal-amber border-signal-amber' : ''}`}
          >
            {autoRefresh ? 'PAUSE' : 'STREAM'}
          </button>

          <button
            onClick={fetchLogs}
            className="btn-rack p-1.5"
            title="Refresh stream"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleCopy}
            className="btn-rack p-1.5"
            title="Copy buffer"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-signal-amber" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Terminal Buffer Window */}
      <pre
        ref={logContainerRef}
        className="bg-[#0b0d10] p-4 max-h-[500px] min-h-[300px] overflow-y-auto font-mono text-xs text-signal-amber leading-relaxed whitespace-pre-wrap selection:bg-signal-amber selection:text-rack-bg border border-rack-border select-text"
      >
        {logs}
      </pre>
    </div>
  );
};
