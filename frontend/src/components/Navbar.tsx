import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Server, LogOut, Shield, Menu, Terminal, HardDrive } from 'lucide-react';

interface NavbarProps {
  onNewProject?: () => void;
  onToggleMobile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobile }) => {
  const { user, logout, isAdmin } = useAuth();
  const { language, toggleLanguage } = useLanguage();
  const hostIp = window.location.hostname || '192.168.0.245';

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-rack-border bg-rack-panel px-4 sm:px-6 shadow-rack-panel select-none">
      {/* Brand Identity & Mobile Hamburger */}
      <div className="flex items-center gap-3">
        {onToggleMobile && (
          <button
            onClick={onToggleMobile}
            className="lg:hidden p-2 text-trace-dim hover:text-signal-amber border border-rack-border bg-rack-bg"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="h-4 w-4" />
          </button>
        )}

        <Link to="/" className="flex items-center gap-2.5 focus:outline-none group">
          <div className="flex h-8 w-8 items-center justify-center bg-rack-bg border border-signal-amber text-signal-amber font-display font-black text-sm shadow-amber-edge">
            MH
          </div>
          <div className="flex flex-col">
            <span className="font-display font-extrabold text-sm tracking-wider text-trace-silver group-hover:text-signal-amber transition-colors">
              MULTI<span className="text-signal-amber">HOSTING</span> // DECK
            </span>
            <span className="text-[9px] font-mono text-trace-dim uppercase tracking-widest -mt-0.5">
              ON-PREM SWITCHBOARD
            </span>
          </div>
        </Link>
      </div>

      {/* Center Hardware Bus Status */}
      <div className="hidden md:flex items-center gap-3 px-3 py-1 bg-rack-bg border border-rack-border text-[11px] font-mono">
        <span className="flex items-center gap-1.5 text-signal-amber">
          <span className="h-2 w-2 rounded-full bg-signal-amber filament-amber"></span>
          <strong className="text-trace-silver">BUS:</strong> {hostIp}
        </span>
        <span className="text-rack-border">|</span>
        <span className="text-trace-dim">
          SOCKET POOL: <strong className="text-trace-silver">:16000+</strong>
        </span>
      </div>

      {/* Right Hardware Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="btn-rack flex items-center gap-1.5"
          title={language === 'en' ? 'Cambiar a Español' : 'Switch to English'}
          aria-label="Toggle language"
        >
          <span className="text-xs">{language === 'en' ? 'EN' : 'ES'}</span>
          <span className="text-signal-amber">[{language.toUpperCase()}]</span>
        </button>

        {/* User Status and Break Switch */}
        {user && (
          <div className="flex items-center gap-2 sm:gap-3 border-l border-rack-border pl-2 sm:pl-3">
            <div className="flex items-center gap-2">
              <div className="hidden lg:block text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="font-mono text-xs font-bold text-trace-silver">
                    {user.username}
                  </span>
                  {isAdmin ? (
                    <span className="bg-signal-amber/15 text-signal-amber border border-signal-amber/30 px-1 py-0.2 text-[9px] font-mono font-bold">
                      ROOT
                    </span>
                  ) : (
                    <span className="bg-rack-subtle text-trace-dim border border-rack-border px-1 py-0.2 text-[9px] font-mono">
                      DEV
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 border border-rack-border text-trace-dim hover:text-breaker-red hover:border-breaker-red bg-rack-bg transition"
              title="Terminate Session"
              aria-label="Terminate session"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
