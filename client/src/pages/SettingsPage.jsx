import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Database, 
  Server, 
  Activity, 
  ShieldCheck, 
  Clock, 
  HardDrive, 
  Cpu, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Check,
  Loader2
} from 'lucide-react';
import api from '../services/api';

export default function SettingsPage() {
  const [health, setHealth] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [healthRes, settingsRes] = await Promise.all([
        api.get('/system/health'),
        api.get('/system/settings')
      ]);
      setHealth(healthRes.data);
      setSettings(settingsRes.data);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }

  const webhookUrl = `${window.location.origin}/api/webhooks/github`;

  function copyWebhookUrl() {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  }

  if (loading) {
    return (
      <div className="py-24 flex justify-center text-brand-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const isDbConnected = health?.services?.database?.status === 'connected';
  const isDockerConnected = health?.services?.docker?.status === 'connected';

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Platform Settings & Status</h1>
        <p className="text-xs text-dark-muted font-medium mt-1">
          Inspect container runtime, reverse proxy domain, and webhook configurations.
        </p>
      </div>

      {/* Real-time System Connectivity Matrix */}
      <div className="bg-dark-surface border border-dark-border rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
          Infrastructure Services Status
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          {/* Database */}
          <div className="p-4 rounded-xl bg-dark-bg border border-dark-border flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-dark-muted block">MySQL Database</span>
              <span className="font-bold text-white">Prisma ORM</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isDbConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
              <span className={isDbConnected ? 'text-emerald-300 font-bold' : 'text-rose-400 font-bold'}>
                {isDbConnected ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Docker */}
          <div className="p-4 rounded-xl bg-dark-bg border border-dark-border flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-dark-muted block">Docker Engine</span>
              <span className="font-bold text-white">{health?.services?.docker?.version || 'Dockerode'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isDockerConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className={isDockerConnected ? 'text-emerald-300 font-bold' : 'text-amber-300 font-bold'}>
                {isDockerConnected ? 'Connected' : 'Unreachable'}
              </span>
            </div>
          </div>

          {/* Traefik */}
          <div className="p-4 rounded-xl bg-dark-bg border border-dark-border flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-dark-muted block">Traefik Proxy</span>
              <span className="font-bold text-white">Dynamic Docker</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-300 font-bold">Active (:80)</span>
            </div>
          </div>

          {/* Socket.IO */}
          <div className="p-4 rounded-xl bg-dark-bg border border-dark-border flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-dark-muted block">Realtime Hub</span>
              <span className="font-bold text-white">Socket.IO WS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 font-bold">Streaming</span>
            </div>
          </div>
        </div>

        {!isDockerConnected && (
          <div className="p-3 rounded-lg bg-amber-950/70 border border-amber-800 text-xs text-amber-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Docker Daemon Unavailable</span>
            </div>
            <p className="text-dark-muted text-[11px]">
              {health?.services?.docker?.error || 'Make sure Docker Desktop is started.'} Real preview containers will build and run automatically when Docker Engine is accessible.
            </p>
          </div>
        )}
      </div>

      {/* GitHub Webhook Configuration Guide */}
      <div className="bg-dark-surface border border-dark-border rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>GitHub Webhook Configuration</span>
        </h2>
        <p className="text-xs text-dark-muted leading-relaxed">
          In your GitHub repository settings under <strong>Webhooks → Add webhook</strong>, configure these settings:
        </p>

        <div className="space-y-3 font-mono text-xs">
          <div className="space-y-1">
            <label className="text-slate-400 block text-[11px]">Payload URL</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="flex-1 bg-dark-bg border border-dark-border rounded px-3 py-2 text-brand-400 focus:outline-none"
              />
              <button
                onClick={copyWebhookUrl}
                className="p-2 rounded bg-dark-bg border border-dark-border hover:border-slate-600 text-slate-300"
              >
                {copiedUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded bg-dark-bg border border-dark-border space-y-1">
              <span className="text-dark-muted text-[11px]">Content type</span>
              <span className="text-slate-200 font-bold block">application/json</span>
            </div>
            <div className="p-3 rounded bg-dark-bg border border-dark-border space-y-1">
              <span className="text-dark-muted text-[11px]">Secret</span>
              <span className="text-emerald-400 font-bold block">Configured in .env</span>
            </div>
            <div className="p-3 rounded bg-dark-bg border border-dark-border space-y-1">
              <span className="text-dark-muted text-[11px]">Events</span>
              <span className="text-slate-200 font-bold block">Pull requests, Push</span>
            </div>
          </div>
        </div>
      </div>

      {/* Resource Limits & Timing Policy */}
      <div className="bg-dark-surface border border-dark-border rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
          Container Isolation & Resource Limits
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-dark-bg border border-dark-border space-y-1">
            <div className="flex items-center gap-1.5 text-dark-muted">
              <HardDrive className="w-3.5 h-3.5" />
              <span>Memory Limit</span>
            </div>
            <span className="text-base font-bold text-white block">{settings?.resourceLimits?.memoryLimit || '512m'}</span>
          </div>

          <div className="p-4 rounded-xl bg-dark-bg border border-dark-border space-y-1">
            <div className="flex items-center gap-1.5 text-dark-muted">
              <Cpu className="w-3.5 h-3.5" />
              <span>CPU Quota</span>
            </div>
            <span className="text-base font-bold text-white block">{settings?.resourceLimits?.cpuLimit || 1} Core</span>
          </div>

          <div className="p-4 rounded-xl bg-dark-bg border border-dark-border space-y-1">
            <div className="flex items-center gap-1.5 text-dark-muted">
              <Clock className="w-3.5 h-3.5" />
              <span>Max Lifetime</span>
            </div>
            <span className="text-base font-bold text-white block">{settings?.maxLifetimeSeconds || 3600}s (1h)</span>
          </div>

          <div className="p-4 rounded-xl bg-dark-bg border border-dark-border space-y-1">
            <div className="flex items-center gap-1.5 text-dark-muted">
              <Activity className="w-3.5 h-3.5" />
              <span>Health Endpoint</span>
            </div>
            <span className="text-base font-bold text-white block">{settings?.healthCheckPath || '/health'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
