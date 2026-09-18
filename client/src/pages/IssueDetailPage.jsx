import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Bug, 
  GitCommit, 
  GitPullRequest, 
  Box, 
  Monitor, 
  Globe, 
  Terminal, 
  Activity, 
  RotateCw, 
  ExternalLink, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2 
} from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function IssueDetailPage() {
  const { id } = useParams();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reproducing, setReproducing] = useState(false);
  const [reproductionMessage, setReproductionMessage] = useState(null);

  useEffect(() => {
    fetchIssue();
  }, [id]);

  async function fetchIssue() {
    try {
      const res = await api.get(`/issues/${id}`);
      setIssue(res.data);
    } catch (err) {
      console.error('Failed to load issue:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus) {
    try {
      const res = await api.patch(`/issues/${id}/status`, { status: newStatus });
      setIssue(prev => ({ ...prev, status: res.data.status }));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  }

  async function handleReproduce() {
    setReproducing(true);
    setReproductionMessage(null);
    try {
      const res = await api.post(`/issues/${id}/reproduce`);
      setReproductionMessage(res.data.message);
      fetchIssue();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to trigger reproduction');
    } finally {
      setReproducing(false);
    }
  }

  if (loading) {
    return (
      <div className="py-24 flex justify-center text-brand-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="text-center py-24 space-y-4">
        <h2 className="text-xl font-bold text-white">Issue Not Found</h2>
        <Link to="/issues" className="text-brand-400 hover:underline text-sm">
          Return to Issues
        </Link>
      </div>
    );
  }

  const context = issue.context || {};
  const browserInfo = context.parsedBrowserInfo || {};
  const relevantLogs = context.parsedLogs || [];
  const apiActivity = context.parsedApiActivity || [];
  const exactCommitSha = context.commitSha || issue.pullRequest?.commitSha;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Back Button */}
      <div>
        <Link
          to="/issues"
          className="inline-flex items-center gap-2 text-xs font-mono text-dark-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Issues</span>
        </Link>
      </div>

      {/* Header Box */}
      <div className="bg-dark-surface border border-dark-border rounded-2xl p-6 shadow-md space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-dark-bg border border-dark-border text-dark-muted">
                #{issue.id.substring(0, 8)}
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight">{issue.title}</h1>
              <StatusBadge status={issue.severity} type="severity" />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-dark-muted">
              <span className="flex items-center gap-1.5 text-slate-300">
                <GitPullRequest className="w-3.5 h-3.5 text-brand-400" />
                PR #{issue.pullRequest?.number} ({issue.pullRequest?.repository?.fullName})
              </span>
              <span className="flex items-center gap-1.5 text-brand-400 font-semibold">
                <GitCommit className="w-3.5 h-3.5 text-brand-500" />
                Commit: {exactCommitSha}
              </span>
              <span>Reported by {issue.createdBy}</span>
            </div>
          </div>

          {/* Actions: Status update + Reproduce */}
          <div className="flex items-center gap-3">
            <select
              value={issue.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="text-xs bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-brand-500"
            >
              <option value="OPEN">Status: OPEN</option>
              <option value="IN_PROGRESS">Status: IN PROGRESS</option>
              <option value="RESOLVED">Status: RESOLVED</option>
              <option value="CLOSED">Status: CLOSED</option>
            </select>

            <button
              onClick={handleReproduce}
              disabled={reproducing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-950/40 transition-all"
            >
              <RotateCw className={`w-3.5 h-3.5 ${reproducing ? 'animate-spin' : ''}`} />
              <span>Reproduce Issue</span>
            </button>
          </div>
        </div>

        {reproductionMessage && (
          <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{reproductionMessage} (Target commit: {exactCommitSha.substring(0, 10)})</span>
          </div>
        )}
      </div>

      {/* Description & Reproduction Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-dark-surface border border-dark-border rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-dark-muted font-mono">Description</h3>
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{issue.description}</p>

          {issue.stepsToReproduce && (
            <div className="pt-3 border-t border-dark-border/60">
              <h4 className="text-xs font-bold uppercase tracking-wider text-dark-muted font-mono mb-2">Steps to Reproduce</h4>
              <pre className="text-xs font-mono text-slate-300 bg-dark-bg p-3 rounded-lg border border-dark-border/60 whitespace-pre-wrap">
                {issue.stepsToReproduce}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-dark-surface border border-dark-border rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-dark-muted font-mono">Expected vs Actual</h3>
          <div className="space-y-3 text-xs">
            <div>
              <span className="font-semibold text-emerald-400 block mb-1">Expected Behavior:</span>
              <p className="text-slate-300 bg-dark-bg p-2.5 rounded-lg border border-dark-border/60">{issue.expectedBehavior || 'Not specified'}</p>
            </div>
            <div>
              <span className="font-semibold text-rose-400 block mb-1">Actual Behavior:</span>
              <p className="text-slate-300 bg-dark-bg p-2.5 rounded-lg border border-dark-border/60">{issue.actualBehavior || 'Not specified'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Captured Technical Context (Differentiating Feature) */}
      <div className="bg-dark-surface border border-brand-500/30 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-dark-border/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Monitor className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Automatically Captured Technical Context</h2>
              <p className="text-xs text-dark-muted">Exact commit, container ID, logs, and network requests captured during bug submission.</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-brand-500/10 text-brand-400 border border-brand-500/30">
            AUTO CAPTURED
          </span>
        </div>

        {/* Technical Context Metadata Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 rounded-lg bg-dark-bg border border-dark-border">
            <span className="text-dark-muted text-[11px] block">Historical Commit SHA</span>
            <span className="text-brand-400 font-bold break-all">{exactCommitSha}</span>
          </div>
          <div className="p-3 rounded-lg bg-dark-bg border border-dark-border">
            <span className="text-dark-muted text-[11px] block">Container ID</span>
            <span className="text-slate-200">{context.containerId ? context.containerId.substring(0, 12) : 'builddeck-pr-42'}</span>
          </div>
          <div className="p-3 rounded-lg bg-dark-bg border border-dark-border">
            <span className="text-dark-muted text-[11px] block">Viewport & Resolution</span>
            <span className="text-slate-200">{browserInfo.viewport || '1440x900'} ({browserInfo.screenResolution || '1920x1080'})</span>
          </div>
          <div className="p-3 rounded-lg bg-dark-bg border border-dark-border">
            <span className="text-dark-muted text-[11px] block">Preview URL</span>
            <span className="text-emerald-400 truncate block">{context.currentUrl || 'http://pr-42.preview.localhost'}</span>
          </div>
        </div>

        {/* API Activity Table (Redacted) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-brand-400" />
              <span>Redacted Frontend API Activity</span>
            </h3>
            <span className="text-[11px] text-dark-muted font-mono">Passwords & Auth Tokens Redacted</span>
          </div>

          <div className="border border-dark-border rounded-lg overflow-hidden bg-dark-bg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-dark-surface/90 text-dark-muted border-b border-dark-border">
                <tr>
                  <th className="p-2.5">Method</th>
                  <th className="p-2.5">Endpoint Path</th>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40">
                {apiActivity.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-3 text-center text-dark-muted italic">No API calls recorded.</td>
                  </tr>
                ) : (
                  apiActivity.map((call, idx) => (
                    <tr key={idx} className="hover:bg-white/5">
                      <td className="p-2.5 font-bold text-brand-400">{call.method}</td>
                      <td className="p-2.5 text-slate-300">{call.path}</td>
                      <td className="p-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          call.statusCode >= 500
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : call.statusCode >= 400
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}>
                          {call.statusCode}
                        </span>
                      </td>
                      <td className="p-2.5 text-dark-muted">{call.duration}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Captured Tail Logs */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-brand-400" />
            <span>Captured Container Tail Logs</span>
          </h3>
          <div className="bg-[#0c1017] border border-dark-border rounded-xl p-4 font-mono text-xs max-h-56 overflow-y-auto space-y-1">
            {relevantLogs.length === 0 ? (
              <p className="text-dark-muted italic">No logs attached to this issue.</p>
            ) : (
              relevantLogs.map((line, idx) => (
                <div key={idx} className="text-slate-300 flex items-start gap-2">
                  <span className="text-slate-600 select-none text-[11px] w-6">{idx + 1}</span>
                  <span className={line.includes('500') || line.includes('error') ? 'text-rose-400' : 'text-slate-300'}>
                    {line}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
