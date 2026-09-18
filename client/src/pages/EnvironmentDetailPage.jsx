import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, ExternalLink, ArrowLeft, Loader2, RotateCw, Trash2, Cpu, HardDrive } from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import StatusBadge from '../components/StatusBadge';
import LogViewer from '../components/LogViewer';
import PreviewButton from '../components/PreviewButton';

export default function EnvironmentDetailPage() {
  const { id } = useParams();
  const [env, setEnv] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    fetchEnv();
  }, [id]);

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('join:environment', id);

    function handleEnvLog(payload) {
      if (payload.environmentId === id) {
        setEnv(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            logs: [...(prev.logs || []), payload.log]
          };
        });
      }
    }

    function handleEnvStatus(updatedEnv) {
      if (updatedEnv.id === id) {
        setEnv(prev => ({ ...prev, ...updatedEnv }));
      }
    }

    socket.on('environment:log', handleEnvLog);
    socket.on('environment:updated', handleEnvStatus);
    socket.on('environment:running', handleEnvStatus);
    socket.on('environment:failed', handleEnvStatus);

    return () => {
      socket.emit('leave:environment', id);
      socket.off('environment:log', handleEnvLog);
      socket.off('environment:updated', handleEnvStatus);
      socket.off('environment:running', handleEnvStatus);
      socket.off('environment:failed', handleEnvStatus);
    };
  }, [socket, id]);

  async function fetchEnv() {
    try {
      const res = await api.get(`/environments/${id}`);
      setEnv(res.data);
      if (res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load environment:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDestroy() {
    if (!confirm('Destroy this preview container?')) return;
    try {
      await api.post(`/environments/${id}/destroy`);
      fetchEnv();
    } catch (err) {
      console.error('Failed to destroy:', err);
    }
  }

  if (loading) {
    return (
      <div className="py-24 flex justify-center text-brand-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!env) {
    return (
      <div className="text-center py-24 space-y-4">
        <h2 className="text-xl font-bold text-white">Preview Environment Not Found</h2>
        <Link to="/dashboard" className="text-brand-400 hover:underline text-sm">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/pull-requests/${env.pullRequestId}`}
          className="inline-flex items-center gap-2 text-xs font-mono text-dark-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to PR #{env.pullRequest?.number}</span>
        </Link>
      </div>

      {/* Header */}
      <div className="bg-dark-surface border border-dark-border rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white tracking-tight">Preview Environment</h1>
            <StatusBadge status={env.status} type="environment" />
          </div>
          <p className="text-xs font-mono text-dark-muted">ID: {env.id}</p>
        </div>

        <div className="flex items-center gap-3">
          {env.status === 'RUNNING' && env.previewUrl && (
            <a
              href={env.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Preview</span>
            </a>
          )}
          {env.status !== 'DESTROYED' && (
            <button
              onClick={handleDestroy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-dark-bg border border-dark-border hover:border-rose-800 text-dark-muted hover:text-rose-400 text-xs font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Destroy</span>
            </button>
          )}
        </div>
      </div>

      {/* Container Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-dark-surface border border-dark-border rounded-xl p-4">
          <span className="text-[11px] font-mono text-dark-muted uppercase">Container ID</span>
          <p className="text-sm font-bold text-white font-mono mt-1">
            {env.containerId ? env.containerId.substring(0, 12) : 'None'}
          </p>
        </div>
        <div className="bg-dark-surface border border-dark-border rounded-xl p-4">
          <span className="text-[11px] font-mono text-dark-muted uppercase">Commit SHA</span>
          <p className="text-sm font-bold text-brand-400 font-mono mt-1">
            {env.commitSha?.substring(0, 10)}
          </p>
        </div>
        <div className="bg-dark-surface border border-dark-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-dark-muted uppercase">Memory Usage</span>
            <p className="text-sm font-bold text-white font-mono mt-1">
              {stats?.memoryUsageMB || '0.00'} / {stats?.memoryLimitMB || '512.00'} MB
            </p>
          </div>
          <HardDrive className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="bg-dark-surface border border-dark-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-dark-muted uppercase">CPU Usage</span>
            <p className="text-sm font-bold text-white font-mono mt-1">
              {stats?.cpuPercent || '0.0%'}
            </p>
          </div>
          <Cpu className="w-5 h-5 text-brand-400" />
        </div>
      </div>

      {/* Logs */}
      <LogViewer
        logs={env.logs || []}
        title="Real-Time Container Terminal"
        isLive={env.status === 'RUNNING' || env.status === 'BUILDING'}
      />
    </div>
  );
}
