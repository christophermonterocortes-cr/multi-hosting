import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Server, 
  Terminal, 
  Database, 
  Network, 
  Cpu, 
  ShieldCheck, 
  ArrowRight, 
  ExternalLink,
  Code2,
  HardDrive,
  Activity,
  Layers,
  Sparkles,
  Lock
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const isApex = typeof window !== 'undefined' && (window.location.hostname === 'multi-hosting.com');
  const dashboardUrl = isApex ? 'https://www.multi-hosting.com' : '/';

  return (
    <div className="min-h-screen bg-rack-bg text-trace-silver font-mono selection:bg-signal-amber selection:text-rack-bg select-none">
      {/* Top Hardware Rail */}
      <header className="border-b border-rack-border bg-rack-panel sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-rack-bg border border-signal-amber text-signal-amber font-display font-black flex items-center justify-center text-sm shadow-amber-edge">
              MH
            </div>
            <div>
              <span className="font-display font-black text-sm tracking-wider text-trace-silver">
                MULTI<span className="text-signal-amber">HOSTING</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] text-trace-dim font-mono">
                [ BARE-METAL SERVER ORCHESTRATION ]
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="#specs"
              className="text-xs text-trace-dim hover:text-trace-silver px-2.5 py-1 transition"
            >
              [ SPECS ]
            </a>
            <a
              href="#architecture"
              className="text-xs text-trace-dim hover:text-trace-silver px-2.5 py-1 transition hidden sm:inline-block"
            >
              [ ARCHITECTURE ]
            </a>
            <a
              href={dashboardUrl}
              className="btn-rack btn-rack-primary flex items-center gap-1.5 text-xs shadow-hard"
            >
              <span>LAUNCH DECK</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-rack-border overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 border border-signal-amber bg-signal-amber/10 px-3 py-1 text-signal-amber text-xs font-bold">
                <span className="h-2 w-2 rounded-full bg-signal-amber filament-amber"></span>
                <span>BARE-METAL ON-PREMISES CONTAINER CLOUD</span>
              </div>

              <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-trace-silver tracking-tight leading-none uppercase">
                HOST ISOLATED WEBSITES ON <span className="text-signal-amber">YOUR OWN HARDWARE.</span>
              </h1>

              <p className="text-sm sm:text-base text-trace-dim leading-relaxed max-w-2xl font-mono">
                Multi-Hosting turns any Linux server, Debian box, or TrueNAS storage chassis into an enterprise hosting appliance. 
                Provision atomic container blades, assign instant subdomains <code className="text-signal-amber bg-rack-panel px-1.5 py-0.5 border border-rack-border">https://[app].multi-hosting.com</code>, 
                and attach dedicated MariaDB/PostgreSQL databases in seconds.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={dashboardUrl}
                  className="btn-rack btn-rack-primary flex items-center gap-2 py-3 px-5 text-sm shadow-hard"
                >
                  <Server className="h-4 w-4" />
                  <span>ACCESS CONTROL DECK (WWW)</span>
                  <ArrowRight className="h-4 w-4" />
                </a>

                <a
                  href="https://github.com/christophermonterocortes-cr/multi-hosting"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-rack flex items-center gap-2 py-3 px-4 text-xs"
                >
                  <Code2 className="h-4 w-4 text-trace-dim" />
                  <span>GITHUB REPO</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Hardware Spec Tags */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-rack-border/70 text-xs">
                <div className="p-2.5 bg-rack-panel border border-rack-border">
                  <span className="text-trace-dim text-[10px] block uppercase font-bold">SOCKET RANGE</span>
                  <strong className="text-signal-amber font-display">:16000 – :20000</strong>
                </div>
                <div className="p-2.5 bg-rack-panel border border-rack-border">
                  <span className="text-trace-dim text-[10px] block uppercase font-bold">DATABASE ENGINES</span>
                  <strong className="text-trace-silver font-display">MARIADB & PGSQL</strong>
                </div>
                <div className="p-2.5 bg-rack-panel border border-rack-border col-span-2 sm:col-span-1">
                  <span className="text-trace-dim text-[10px] block uppercase font-bold">TUNNEL ROUTING</span>
                  <strong className="text-signal-amber font-display">CLOUDFLARE ARGO</strong>
                </div>
              </div>
            </div>

            {/* Right Interactive Chassis Preview */}
            <div className="lg:col-span-5">
              <div className="rack-blade border-2 border-signal-amber bg-rack-panel p-5 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-rack-border pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-signal-amber filament-amber"></span>
                    <span className="font-display font-bold text-xs text-trace-silver uppercase tracking-wider">
                      [ NODE TELEMETRY // LIVE CHASSIS ]
                    </span>
                  </div>
                  <span className="text-[10px] bg-rack-bg border border-rack-border px-1.5 py-0.5 text-signal-amber font-bold">
                    ONLINE
                  </span>
                </div>

                {/* Simulated 1U Blade 1 */}
                <div className="border border-rack-border bg-rack-bg p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-signal-amber"></span>
                      <strong className="text-trace-silver font-display">example.multi-hosting.com</strong>
                    </div>
                    <span className="bg-rack-panel border border-rack-border px-1.5 py-0.2 text-[9px] font-bold text-signal-amber">
                      PHP 8.2
                    </span>
                  </div>
                  <div className="text-[10px] text-trace-dim flex justify-between font-mono">
                    <span>TCP SOCKET: :16014</span>
                    <span className="text-signal-amber">MEM: [████████░░░░] 64MB</span>
                  </div>
                </div>

                {/* Simulated 1U Blade 2 */}
                <div className="border border-rack-border bg-rack-bg p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-signal-amber"></span>
                      <strong className="text-trace-silver font-display">store.multi-hosting.com</strong>
                    </div>
                    <span className="bg-rack-panel border border-rack-border px-1.5 py-0.2 text-[9px] font-bold text-trace-silver">
                      STATIC NGINX
                    </span>
                  </div>
                  <div className="text-[10px] text-trace-dim flex justify-between font-mono">
                    <span>TCP SOCKET: :16015</span>
                    <span className="text-signal-amber">MEM: [████░░░░░░░░] 22MB</span>
                  </div>
                </div>

                {/* ASCII Host Gauges */}
                <div className="border-t border-rack-border pt-3 space-y-1.5 text-[10px]">
                  <div className="flex justify-between text-trace-dim">
                    <span>CPU ALLOCATION (12 CORES):</span>
                    <span className="text-signal-amber">[██████░░░░░░░░░░] 28%</span>
                  </div>
                  <div className="flex justify-between text-trace-dim">
                    <span>STORAGE POOL (/mnt/DISK_MAC):</span>
                    <span className="text-trace-silver">[██████████░░░░░░] 54%</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Architecture Matrix */}
      <section id="specs" className="py-16 sm:py-20 border-b border-rack-border bg-rack-panel">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="font-display font-black text-2xl sm:text-3xl text-trace-silver uppercase tracking-wider">
              [ HARDWARE-FIRST ARCHITECTURE ]
            </h2>
            <p className="text-xs text-trace-dim">
              BUILT FOR RESILIENCE, ISOLATION, AND UNCOMPROMISED LOCAL CONTROL
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Feature 1 */}
            <div className="rack-blade p-5 border-rack-border bg-rack-bg space-y-3">
              <div className="h-8 w-8 bg-rack-panel border border-signal-amber flex items-center justify-center text-signal-amber">
                <Network className="h-4 w-4" />
              </div>
              <h3 className="font-display font-bold text-sm text-trace-silver uppercase">
                [ ATOMIC SUBDOMAIN ROUTER ]
              </h3>
              <p className="text-xs text-trace-dim leading-relaxed">
                Automatic wildcard resolution for <code className="text-signal-amber">*.multi-hosting.com</code> via Cloudflare Tunnel. 
                Incoming requests dynamically resolve to dedicated container sockets with zero manual DNS edits.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rack-blade p-5 border-rack-border bg-rack-bg space-y-3">
              <div className="h-8 w-8 bg-rack-panel border border-signal-amber flex items-center justify-center text-signal-amber">
                <Server className="h-4 w-4" />
              </div>
              <h3 className="font-display font-bold text-sm text-trace-silver uppercase">
                [ 1U HARDWARE SANDBOXING ]
              </h3>
              <p className="text-xs text-trace-dim leading-relaxed">
                Strict container memory ceilings, CPU shares, and sibling read-only volume mounts keep your projects 
                isolated and protected from neighbor interference.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rack-blade p-5 border-rack-border bg-rack-bg space-y-3">
              <div className="h-8 w-8 bg-rack-panel border border-signal-amber flex items-center justify-center text-signal-amber">
                <Database className="h-4 w-4" />
              </div>
              <h3 className="font-display font-bold text-sm text-trace-silver uppercase">
                [ ISOLATED DATABASE ENGINES ]
              </h3>
              <p className="text-xs text-trace-dim leading-relaxed">
                Instant provisioning of dedicated PostgreSQL and MariaDB schemas with AES-256 passkey encryption, 
                direct .env exports, and integrated phpMyAdmin.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rack-blade p-5 border-rack-border bg-rack-bg space-y-3">
              <div className="h-8 w-8 bg-rack-panel border border-signal-amber flex items-center justify-center text-signal-amber">
                <Terminal className="h-4 w-4" />
              </div>
              <h3 className="font-display font-bold text-sm text-trace-silver uppercase">
                [ IN-BROWSER WORKSTATION ]
              </h3>
              <p className="text-xs text-trace-dim leading-relaxed">
                Full web-based file editor, recursive folder & ZIP unpacker, live document root switching, 
                and real-time stdout/stderr log streaming.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rack-blade p-5 border-rack-border bg-rack-bg space-y-3">
              <div className="h-8 w-8 bg-rack-panel border border-signal-amber flex items-center justify-center text-signal-amber">
                <Activity className="h-4 w-4" />
              </div>
              <h3 className="font-display font-bold text-sm text-trace-silver uppercase">
                [ 5-SECOND TELEMETRY PROBES ]
              </h3>
              <p className="text-xs text-trace-dim leading-relaxed">
                Continuous host compute polling, disk pool footprint tracking, and atomic port reservation matrix 
                guarantee zero collisions across the :16000–:20000 range.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rack-blade p-5 border-rack-border bg-rack-bg space-y-3">
              <div className="h-8 w-8 bg-rack-panel border border-signal-amber flex items-center justify-center text-signal-amber">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h3 className="font-display font-bold text-sm text-trace-silver uppercase">
                [ SECURITY FLIGHT RECORDER ]
              </h3>
              <p className="text-xs text-trace-dim leading-relaxed">
                Immutable audit trail of all deployments, account provisioning, passkey rekeying, and socket mutations 
                stored in transacted WAL-mode SQLite.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Domain Strategy Guide Section */}
      <section id="architecture" className="py-16 sm:py-20 border-b border-rack-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="font-display font-black text-2xl text-trace-silver uppercase tracking-wider">
              [ DOMAIN & CLOUDFLARE ROUTING TOPOLOGY ]
            </h2>
            <p className="text-xs text-trace-dim">HOW TRAFFIC FLOWS FROM INTERNET TO CONTAINER</p>
          </div>

          <div className="rack-blade p-6 border-rack-border bg-rack-panel space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-rack-bg border border-rack-border space-y-2">
                <span className="text-[10px] text-signal-amber font-bold uppercase block">APEX DOMAIN</span>
                <h4 className="font-display font-bold text-base text-trace-silver">multi-hosting.com</h4>
                <p className="text-xs text-trace-dim">Public landing page showcasing platform architecture and system overview.</p>
              </div>

              <div className="p-4 bg-rack-bg border border-signal-amber space-y-2">
                <span className="text-[10px] text-signal-amber font-bold uppercase block">APP DASHBOARD</span>
                <h4 className="font-display font-bold text-base text-trace-silver">www.multi-hosting.com</h4>
                <p className="text-xs text-trace-dim">Operator authentication gate, switchboard deck, port matrix, and file manager.</p>
              </div>

              <div className="p-4 bg-rack-bg border border-rack-border space-y-2">
                <span className="text-[10px] text-signal-amber font-bold uppercase block">HOSTED APPS WILDCARD</span>
                <h4 className="font-display font-bold text-base text-trace-silver">[slug].multi-hosting.com</h4>
                <p className="text-xs text-trace-dim">Transparent dynamic reverse proxy directly to the allocated container port (:16000+).</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-rack-bg text-trace-dim text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-signal-amber filament-amber"></span>
            <span className="font-display font-bold text-trace-silver">MULTI-HOSTING PLATFORM</span>
            <span>•</span>
            <span>ON-PREMISES DEPLOYMENT</span>
          </div>

          <div className="flex items-center gap-4">
            <a href={dashboardUrl} className="text-signal-amber font-bold hover:underline">
              [ ENTER SWITCHBOARD DECK ]
            </a>
            <span>© {currentYear} MULTI-HOSTING</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
