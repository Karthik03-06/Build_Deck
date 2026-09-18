import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  GitPullRequest, 
  GitBranch, 
  GitCommit, 
  User, 
  Bug, 
  Box, 
  ExternalLink, 
  ArrowLeft, 
  FileCode, 
  Loader2,
  Play,
  RotateCw,
  Trash2
} from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import StatusBadge from '../components/StatusBadge';
import EnvironmentTimeline from '../components/EnvironmentTimeline';
import LogViewer from '../components/LogViewer';
import PreviewButton from '../components/PreviewButton';
import IssueReportModal from '../components/IssueReportModal';

export default function PullRequestDetailPage() {
  const { id } = useParams();
  const [pr, setPr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    fetchPR();
  }, [id]);

  // Real-time subscription to this PR & Environment room
  useEffect(() => {
    if (!socket || !id) return;

    socket.emit('join:pr', id);

    function handleEnvStatus(env) {
      setPr((prev) => {
        if (!prev) return prev;
        const envs = [...(prev.previewEnvironments || [])];
        const idx = envs.findIndex(e => e.id === env.id);
        if (idx >= 0) {
          envs[idx] = { ...envs[idx], ...env };
        } else {
          envs.unshift(env);
        }
        return { ...prev, previewEnvironments: envs };
      });
    }

    function handleEnvLog(payload) {
      setPr((prev) => {
        if (!prev) return prev;
        const envs = [...(prev.previewEnvironments || [])];
        if (envs.length > 0) {
          const currentEnv = { ...envs[0] };
          const logs = [...(currentEnv.logs || []), payload.log];
          currentEnv.logs = logs;
          envs[0] = currentEnv;
          return { ...prev, previewEnvironments: envs };
        }
        return prev;
      });
    }

    function handleIssueCreated(issue) {
      setPr((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          issues: [issue, ...(prev.issues || [])]
        };
      });
    }

    socket.on('environment:updated', handleEnvStatus);
    socket.on('environment:running', handleEnvStatus);
    socket.on('environment:failed', handleEnvStatus);
    socket.on('environment:destroyed', handleEnvStatus);
    socket.on('environment:log', handleEnvLog);
    socket.on('issue:created', handleIssueCreated);

    return () => {
      socket.emit('leave:pr', id);
      socket.off('environment:updated', handleEnvStatus);
      socket.off('environment:running', handleEnvStatus);
      socket.off('environment:failed', handleEnvStatus);
      socket.off('environment:destroyed', handleEnvStatus);
      socket.off('environment:log', handleEnvLog);
      socket.off('issue:created', handleIssueCreated);
    };
  }, [socket, id]);

  async function fetchPR() {
    try {
      const res = await api.get(`/pull-requests/${id}`);
      setPr(res.data);
    } catch (err) {
      console.error('Failed to load PR:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLaunchPreview() {
    setIsProvisioning(true);
    try {
      await api.post('/environments/provision', {
        pullRequestId: pr.id,
        commitSha: pr.commitSha
      });
      fetchPR();
    } catch (err) {
      console.error('Failed to launch preview:', err);
    } finally {
      setIsProvisioning(false);
    }
  }

  async function handleDestroyPreview(envId) {
    if (!confirm('Are you sure you want to destroy this preview container?')) return;
    try {
      await api.post(`/environments/${envId}/destroy`);
      fetchPR();
    } catch (err) {
      console.error('Failed to destroy preview:', err);
    }
  }

  if (loading) {
    return (
      <div className="py-24 flex justify-center text-brand-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!pr) {
    return (
      <div className="text-center py-24 space-y-4">
        <h2 className="text-xl font-bold text-white">Pull Request Not Found</h2>
        <Link to="/dashboard" className="text-brand-400 hover:underline text-sm">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const activeEnv = pr.previewEnvironments?.[0] || null;
  const envStatus = activeEnv?.status || 'QUEUED';
  const previewUrl = activeEnv?.previewUrl;
  const logs = activeEnv?.logs || [];

  return (
    <div className="space-y-8">
      {/* Breadcrumb & Navigation */}
      <div>
        <Link
          to={`/repositories/${pr.repositoryId}`}
          className="inline-flex items-center gap-2 text-xs font-mono text-dark-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to {pr.repository?.fullName}</span>
        </Link>
      </div>

      {/* PR Header Box */}
      <div className="bg-dark-surface border border-dark-border rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono font-bold px-2.5 py-1 rounded-md bg-dark-bg border border-dark-border text-brand-400">
                PR #{pr.number}
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight">{pr.title}</h1>
              <StatusBadge status={pr.state} type="pr" />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-dark-muted">
              <span className="flex items-center gap-1.5 text-slate-300">
                <User className="w-3.5 h-3.5 text-slate-500" />
                {pr.author}
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <GitBranch className="w-3.5 h-3.5 text-slate-500" />
                {pr.sourceBranch} → {pr.targetBranch}
              </span>
              <span className="flex items-center gap-1.5 text-brand-400 font-semibold">
                <GitCommit className="w-3.5 h-3.5 text-brand-500" />
                {pr.commitSha}
              </span>
            </div>
          </div>

          {/* Action Buttons: Preview + Report Bug */}
          <div className="flex items-center gap-3">
            {activeEnv && (
              <PreviewButton
                status={activeEnv.status}
                previewUrl={activeEnv.previewUrl}
                onLaunch={handleLaunchPreview}
                onDestroy={() => handleDestroyPreview(activeEnv.id)}
                isLoading={isProvisioning}
              />
            )}
            {!activeEnv && (
              <button
                onClick={handleLaunchPreview}
                disabled={isProvisioning}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-all"
              >
                {isProvisioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                <span>Launch Preview</span>
              </button>
            )}

            <button
              onClick={() => setIsReportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-bg border border-dark-border hover:border-rose-800 text-slate-300 hover:text-rose-400 text-sm font-semibold transition-colors"
            >
              <Bug className="w-4 h-4" />
              <span>Report Bug</span>
            </button>
          </div>
        </div>

        {pr.description && (
          <p className="text-xs text-dark-muted bg-dark-bg/60 p-3 rounded-lg border border-dark-border/60">
            {pr.description}
          </p>
        )}
      </div>

      {/* Dynamic Lifecycle Timeline */}
      <EnvironmentTimeline
        status={envStatus}
        hasIssues={(pr.issues && pr.issues.length > 0)}
        isMerged={pr.state === 'MERGED'}
        isClosed={pr.state === 'CLOSED'}
      />

      {/* Container Details & Live Logs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Container Technical Details */}
        <div className="space-y-6">
          <div className="bg-dark-surface border border-dark-border rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Box className="w-4 h-4 text-brand-400" />
              <span>Preview Container Metadata</span>
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-dark-border/60">
                <span className="text-dark-muted">Status:</span>
                <StatusBadge status={envStatus} type="environment" />
              </div>
              <div className="flex justify-between py-1 border-b border-dark-border/60">
                <span className="text-dark-muted">Commit SHA:</span>
                <span className="text-slate-200 font-bold">{pr.commitSha?.substring(0, 10)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-dark-border/60">
                <span className="text-dark-muted">Container Name:</span>
                <span className="text-slate-300">{activeEnv?.containerId ? `builddeck-pr-${pr.number}` : 'None'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-dark-border/60">
                <span className="text-dark-muted">Traefik Host:</span>
                <span className="text-slate-300">pr-{pr.number}.preview.localhost</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-dark-muted">Internal Port:</span>
                <span className="text-slate-300">3000</span>
              </div>
            </div>

            {previewUrl && envStatus === 'RUNNING' && (
              <div className="pt-2">
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-950 border border-emerald-800 hover:bg-emerald-900 text-emerald-300 text-xs font-bold transition-colors font-mono"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{previewUrl}</span>
                </a>
              </div>
            )}
          </div>

          {/* Changed Files Box */}
          <div className="bg-dark-surface border border-dark-border rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCode className="w-4 h-4 text-brand-400" />
              <span>Changed Files ({pr.changedFiles?.length || 0})</span>
            </h3>
            <div className="space-y-1.5 text-xs font-mono max-h-48 overflow-y-auto">
              {pr.changedFiles?.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-1.5 rounded bg-dark-bg border border-dark-border/50">
                  <span className="text-slate-300 truncate max-w-[200px]">{file.filename}</span>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-emerald-400">+{file.additions}</span>
                    <span className="text-rose-400">-{file.deletions}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Terminal Log Viewer */}
        <div className="lg:col-span-2">
          <LogViewer
            logs={logs}
            title={`Container Logs [PR #${pr.number}]`}
            isLive={envStatus === 'BUILDING' || envStatus === 'STARTING' || envStatus === 'RUNNING'}
          />
        </div>
      </div>

      {/* Issues Reported for this PR */}
      {pr.issues && pr.issues.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <Bug className="w-4 h-4 text-rose-400" />
            <span>Reported Issues ({pr.issues.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pr.issues.map((issue) => (
              <div
                key={issue.id}
                className="bg-dark-surface border border-dark-border rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-dark-muted">#{issue.id.substring(0, 8)}</span>
                    <StatusBadge status={issue.severity} type="severity" />
                  </div>
                  <Link
                    to={`/issues/${issue.id}`}
                    className="text-sm font-bold text-white hover:text-brand-400 transition-colors"
                  >
                    {issue.title}
                  </Link>
                  <p className="text-xs text-dark-muted line-clamp-2 mt-1">{issue.description}</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-dark-border text-xs font-mono text-dark-muted">
                  <span>Commit: {issue.context?.commitSha?.substring(0, 7) || pr.commitSha?.substring(0, 7)}</span>
                  <Link to={`/issues/${issue.id}`} className="text-brand-400 hover:underline">
                    Debug Context →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bug Report Modal */}
      <IssueReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        pullRequestId={pr.id}
        previewUrl={previewUrl}
        onCreated={() => fetchPR()}
      />
    </div>
  );
}
