import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  GitPullRequest, 
  Box, 
  Loader2, 
  XCircle, 
  Bug, 
  Activity, 
  FolderGit2, 
  Plus, 
  ExternalLink,
  Clock
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import PullRequestCard from '../components/PullRequestCard';
import EmptyState from '../components/EmptyState';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({
    activePullRequests: 0,
    runningPreviews: 0,
    activeBuilds: 0,
    failedBuilds: 0,
    openIssues: 0
  });
  const [pullRequests, setPullRequests] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Listen to live Socket.IO events for real-time reactivity without browser refresh!
  useEffect(() => {
    if (!socket) return;

    function handleEnvUpdate(env) {
      fetchDashboardData();
    }

    function handlePrUpdate(pr) {
      fetchDashboardData();
    }

    function handleIssueCreated(issue) {
      fetchDashboardData();
    }

    function handleActivityCreated(act) {
      setActivity((prev) => [act, ...prev.slice(0, 15)]);
    }

    socket.on('environment:updated', handleEnvUpdate);
    socket.on('environment:running', handleEnvUpdate);
    socket.on('environment:failed', handleEnvUpdate);
    socket.on('environment:destroyed', handleEnvUpdate);
    socket.on('pr:updated', handlePrUpdate);
    socket.on('issue:created', handleIssueCreated);
    socket.on('activity:created', handleActivityCreated);

    return () => {
      socket.off('environment:updated', handleEnvUpdate);
      socket.off('environment:running', handleEnvUpdate);
      socket.off('environment:failed', handleEnvUpdate);
      socket.off('environment:destroyed', handleEnvUpdate);
      socket.off('pr:updated', handlePrUpdate);
      socket.off('issue:created', handleIssueCreated);
      socket.off('activity:created', handleActivityCreated);
    };
  }, [socket]);

  async function fetchDashboardData() {
    try {
      const [metricsRes, prsRes] = await Promise.all([
        api.get('/system/metrics'),
        api.get('/pull-requests')
      ]);

      if (metricsRes.data?.metrics) {
        setMetrics(metricsRes.data.metrics);
        setActivity(metricsRes.data.recentActivity || []);
      }
      if (prsRes.data) {
        setPullRequests(prsRes.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Dashboard</h1>
          <p className="text-xs text-dark-muted font-medium mt-1">
            Real-time preview containers, build pipelines, and debugging activity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/repositories"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-950/40 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Connect Repository</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Active PRs"
          value={metrics.activePullRequests}
          icon={GitPullRequest}
          color="brand"
        />
        <MetricCard
          title="Running Previews"
          value={metrics.runningPreviews}
          icon={Box}
          color="emerald"
        />
        <MetricCard
          title="Builds in Progress"
          value={metrics.activeBuilds}
          icon={Loader2}
          color="amber"
        />
        <MetricCard
          title="Failed Builds"
          value={metrics.failedBuilds}
          icon={XCircle}
          color="rose"
        />
        <MetricCard
          title="Open Issues"
          value={metrics.openIssues}
          icon={Bug}
          color="purple"
        />
      </div>

      {/* Main Content Grid: Pull Requests & Real-time Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Pull Requests Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <GitPullRequest className="w-4 h-4 text-brand-400" />
              <span>Pull Requests</span>
            </h2>
            <span className="text-xs text-dark-muted font-mono">{pullRequests.length} total</span>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center text-brand-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : pullRequests.length === 0 ? (
            <EmptyState
              icon={GitPullRequest}
              title="No Pull Requests Detected"
              description="Connect a GitHub repository or trigger a PR webhook to automatically generate an isolated Docker preview."
              action={
                <Link
                  to="/repositories"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Connect Repository</span>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {pullRequests.map((pr) => (
                <PullRequestCard key={pr.id} pr={pr} />
              ))}
            </div>
          )}
        </div>

        {/* Live Activity Stream Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Live Activity</span>
            </h2>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              STREAM
            </span>
          </div>

          <div className="bg-dark-surface border border-dark-border rounded-xl p-4 space-y-3 max-h-[540px] overflow-y-auto">
            {activity.length === 0 ? (
              <p className="text-xs text-dark-muted italic text-center py-6">No recent activity recorded.</p>
            ) : (
              activity.map((act) => (
                <div key={act.id} className="text-xs border-b border-dark-border/60 pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-center justify-between text-dark-muted text-[11px] mb-1 font-mono">
                    <span className="uppercase text-brand-400">{act.type.replace('_', ' ')}</span>
                    <span>{new Date(act.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-200 font-medium">{act.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
