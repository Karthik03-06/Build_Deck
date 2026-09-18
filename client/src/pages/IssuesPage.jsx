import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bug, GitCommit, GitPullRequest, ArrowRight, Filter, Loader2 } from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';

export default function IssuesPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchIssues();
  }, [severityFilter, statusFilter]);

  async function fetchIssues() {
    try {
      const params = {};
      if (severityFilter) params.severity = severityFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/issues', { params });
      setIssues(res.data);
    } catch (err) {
      console.error('Failed to load issues:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Issues & Technical Context</h1>
          <p className="text-xs text-dark-muted font-medium mt-1">
            Bugs reported from PR previews with full reproducible environment context.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs bg-dark-surface border border-dark-border rounded-lg px-3 py-1.5 text-slate-300 font-mono focus:outline-none focus:border-brand-500"
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-dark-surface border border-dark-border rounded-lg px-3 py-1.5 text-slate-300 font-mono focus:outline-none focus:border-brand-500"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex justify-center text-brand-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : issues.length === 0 ? (
        <EmptyState
          icon={Bug}
          title="No Issues Reported"
          description="Open a preview environment on any Pull Request and click 'Report Bug' to automatically capture technical debug context."
        />
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="bg-dark-surface border border-dark-border rounded-xl p-5 hover:border-slate-700 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-dark-muted">#{issue.id.substring(0, 8)}</span>
                  <Link
                    to={`/issues/${issue.id}`}
                    className="text-base font-semibold text-white hover:text-brand-400 transition-colors"
                  >
                    {issue.title}
                  </Link>
                  <StatusBadge status={issue.severity} type="severity" />
                  <span className="text-xs px-2 py-0.5 rounded bg-dark-bg border border-dark-border text-slate-300 font-mono">
                    {issue.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-dark-muted">
                  <span className="flex items-center gap-1 text-slate-300">
                    <GitPullRequest className="w-3.5 h-3.5 text-brand-400" />
                    PR #{issue.pullRequest?.number} ({issue.pullRequest?.repository?.name})
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <GitCommit className="w-3.5 h-3.5 text-slate-500" />
                    {issue.context?.commitSha?.substring(0, 8) || issue.pullRequest?.commitSha?.substring(0, 8)}
                  </span>
                  <span>Reported by {issue.createdBy}</span>
                </div>
              </div>

              <div>
                <Link
                  to={`/issues/${issue.id}`}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-dark-bg border border-dark-border hover:border-brand-500/50 text-slate-200 hover:text-white text-xs font-semibold transition-all group"
                >
                  <span>Debug Context</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-brand-400" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
