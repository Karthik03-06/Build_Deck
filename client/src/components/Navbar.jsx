import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, Activity, ShieldCheck, Github, LogOut, ExternalLink, Database, Server, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  async function fetchHealth() {
    try {
      const res = await api.get('/system/health');
      setHealth(res.data);
    } catch (e) {
      setHealth({
        status: 'degraded',
        services: {
          database: { status: 'disconnected' },
          docker: { status: 'unavailable' }
        }
      });
    }
  }

  const isDbConnected = health?.services?.database?.status === 'connected';
  const isDockerConnected = health?.services?.docker?.status === 'connected';

  return (
    <header className="sticky top-0 z-40 bg-dark-surface/90 backdrop-blur border-b border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-sky-700 flex items-center justify-center shadow-lg shadow-sky-950/40 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                BuildDeck
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/30">
                  Preview Hub
                </span>
              </span>
              <p className="text-[11px] text-dark-muted hidden sm:block font-medium">
                Build. Preview. Test. Debug. Merge.
              </p>
            </div>
          </Link>
        </div>

        {/* Real-time System Connectivity Status */}
        <div className="hidden md:flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-dark-bg border border-dark-border text-slate-300">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>MySQL</span>
            <span className={`w-2 h-2 rounded-full ${isDbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-dark-bg border border-dark-border text-slate-300">
            <Server className="w-3.5 h-3.5 text-slate-400" />
            <span>Docker</span>
            <span className={`w-2 h-2 rounded-full ${isDockerConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} title={isDockerConnected ? 'Connected' : 'Daemon unreachable'} />
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-dark-bg border border-dark-border text-slate-300">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <span>Socket.IO</span>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-500'}`} />
          </div>
        </div>

        {/* User / Auth Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-dark-bg border border-dark-border">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} className="w-6 h-6 rounded-full ring-1 ring-brand-500/50" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold text-white">
                    {user.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
                <span className="text-sm font-medium text-slate-200">{user.displayName || user.username}</span>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                className="p-2 text-dark-muted hover:text-rose-400 hover:bg-dark-bg rounded-lg border border-transparent hover:border-dark-border transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-md shadow-brand-700/30 transition-all"
            >
              <Github className="w-4 h-4" />
              <span>Connect</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
