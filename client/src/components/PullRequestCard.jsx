import React from 'react';
import { Link } from 'react-router-dom';
import { GitPullRequest, GitBranch, GitCommit, User, Bug, ExternalLink } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function PullRequestCard({ pr }) {
  const latestEnv = pr.previewEnvironments?.[0] || null;
  const issueCount = pr._count?.issues ?? (pr.issues?.length || 0);

  return (
    <div className="bg-dark-surface border border-dark-border rounded-xl p-5 hover:border-slate-700 transition-all shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* PR Title & Number */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-dark-bg border border-dark-border text-brand-400">
              #{pr.number}
            </span>
            <Link
              to={`/pull-requests/${pr.id}`}
              className="text-base font-semibold text-slate-100 hover:text-brand-400 transition-colors"
            >
              {pr.title}
            </Link>
            <StatusBadge status={pr.state} type="pr" />
          </div>

          {/* Branch & Commit info */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-dark-muted font-mono pt-1">
            <span className="flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-500" />
              {pr.author}
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <GitBranch className="w-3.5 h-3.5 text-slate-500" />
              {pr.sourceBranch} → {pr.targetBranch}
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <GitCommit className="w-3.5 h-3.5 text-slate-500" />
              {pr.commitSha?.substring(0, 7)}
            </span>
            {issueCount > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                <Bug className="w-3.5 h-3.5" />
                {issueCount} {issueCount === 1 ? 'bug' : 'bugs'}
              </span>
            )}
          </div>
        </div>

        {/* Environment Status & Action Link */}
        <div className="flex items-center gap-3">
          {latestEnv ? (
            <div className="flex items-center gap-2">
              <StatusBadge status={latestEnv.status} type="environment" />
              {latestEnv.status === 'RUNNING' && latestEnv.previewUrl && (
                <a
                  href={latestEnv.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-300 hover:bg-emerald-900 transition-colors"
                  title="Open Preview"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          ) : (
            <span className="text-xs text-dark-muted font-mono">No Preview</span>
          )}

          <Link
            to={`/pull-requests/${pr.id}`}
            className="px-3 py-1.5 rounded-lg bg-dark-bg border border-dark-border hover:border-brand-500/50 text-xs font-medium text-slate-200 hover:text-white transition-all"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}
