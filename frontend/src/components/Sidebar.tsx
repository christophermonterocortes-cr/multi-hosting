import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Network, 
  Database, 
  Users, 
  ScrollText, 
  Activity, 
  Settings,
  Plus,
  Radio,
  Server
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface SidebarSection {
  title: string;
  code: string;
  links: {
    to: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
}

interface SidebarProps {
  onNewProject?: () => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNewProject, onCloseMobile }) => {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const sections: SidebarSection[] = [
    {
      title: t.navPlatform,
      code: '01',
      links: [
        { to: '/', label: t.navOverview, icon: LayoutDashboard },
        { to: '/projects', label: t.navProjects, icon: FolderKanban },
      ]
    },
    {
      title: t.navInfrastructure,
      code: '02',
      links: [
        { to: '/ports', label: t.navPortMatrix, icon: Network, badge: ':16000' },
        { to: '/databases', label: t.navDatabases, icon: Database },
        { to: '/phpmyadmin', label: t.navPhpMyAdmin, icon: ScrollText },
      ]
    },
    ...(isAdmin ? [
      {
        title: t.navManagement,
        code: '03',
        links: [
          { to: '/users', label: t.navUsers, icon: Users },
          { to: '/audit-logs', label: t.navAudit, icon: ScrollText },
          { to: '/settings', label: t.navSettings, icon: Settings }
        ]
      }
    ] : []),
    {
      title: t.navTelemetry,
      code: '04',
      links: [
        { to: '/health', label: t.navHealth, icon: Activity }
      ]
    }
  ];

  return (
    <aside className="w-60 flex-shrink-0 border-r border-rack-border bg-rack-panel p-3.5 flex flex-col justify-between select-none h-full overflow-y-auto font-mono text-xs">
      <div className="space-y-5">
        {/* Physical Deploy Switch Button */}
        {onNewProject && (
          <button
            onClick={() => {
              if (onNewProject) onNewProject();
              if (onCloseMobile) onCloseMobile();
            }}
            className="btn-rack btn-rack-primary w-full flex items-center justify-center gap-2 py-2.5 shadow-hard"
          >
            <Plus className="h-4 w-4" />
            <span className="tracking-wider">PROVISION UNIT</span>
          </button>
        )}

        {/* Section Rails */}
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="flex items-center justify-between px-2 text-[10px] font-bold text-trace-dim uppercase tracking-wider border-b border-rack-border/50 pb-1">
                <span>{section.title}</span>
                <span className="text-signal-amber font-bold">[{section.code}]</span>
              </div>
              <nav className="space-y-0.5 pt-1">
                {section.links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.to === '/'}
                      onClick={() => {
                        if (onCloseMobile) onCloseMobile();
                      }}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-2.5 py-1.5 border text-[11px] font-bold uppercase transition ${
                          isActive
                            ? 'bg-rack-active border-signal-amber text-signal-amber'
                            : 'border-transparent text-trace-silver hover:bg-rack-subtle hover:border-rack-border'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-signal-amber' : 'text-trace-dim'}`} />
                            <span>{link.label}</span>
                          </div>

                          {link.badge && (
                            <span className="bg-rack-bg px-1 py-0.2 text-[9px] font-mono text-trace-dim border border-rack-border">
                              {link.badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* Equipment Tag Footer */}
      <div className="mt-6 border border-rack-border bg-rack-bg p-3 text-[10px] text-trace-dim space-y-1.5">
        <div className="flex items-center justify-between text-trace-silver font-bold">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-signal-amber filament-amber"></span>
            NODE ONLINE
          </span>
          <span>© {currentYear}</span>
        </div>
        <div className="flex items-center justify-between border-t border-rack-border/60 pt-1 text-[9px]">
          <span>SOCKET BUS:</span>
          <span className="text-signal-amber font-mono font-bold">:16000 – :20000</span>
        </div>
      </div>
    </aside>
  );
};
