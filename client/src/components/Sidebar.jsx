import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  GitPullRequest, 
  FolderGit2, 
  Bug, 
  Sliders, 
  Box, 
  ExternalLink 
} from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Repositories', path: '/repositories', icon: FolderGit2 },
    { name: 'Issues & Context', path: '/issues', icon: Bug },
    { name: 'Settings', path: '/settings', icon: Sliders }
  ];

  return (
    <aside className="w-64 bg-dark-surface/50 border-r border-dark-border flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div className="px-3 text-xs font-semibold uppercase tracking-wider text-dark-muted font-mono">
          Navigation
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-500/10 text-brand-400 border border-brand-500/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-dark-bg/60 border border-transparent'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Traefik & Architecture Helper Box */}
      <div className="p-3.5 rounded-xl bg-dark-bg/80 border border-dark-border text-xs space-y-2.5">
        <div className="flex items-center justify-between text-slate-300 font-medium">
          <span className="flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-brand-400" />
            Traefik Proxy
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
            :80
          </span>
        </div>
        <p className="text-[11px] text-dark-muted leading-relaxed">
          Dynamic Traefik routing provides instant URLs at <code className="text-slate-300">*.preview.localhost</code> for active PRs.
        </p>
      </div>
    </aside>
  );
}
