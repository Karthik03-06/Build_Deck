import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FolderGit2, GitPullRequest, ExternalLink, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import api from '../services/api';
import PullRequestCard from '../components/PullRequestCard';
import EmptyState from '../components/EmptyState';

export default function RepositoryDetailPage() {
  const { id } = useParams();
  const [repo, setRepo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRepo();
  }, [id]);

  async function fetchRepo() {
    try {
      const res = await api.get(`/repos/${id}`);
      setRepo(res.data);
    } catch (err) {
      console.error('Failed to load repo:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="py-24 flex justify-center text-brand-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!repo) {
    return (
      <div className="text-center py-24 space-y-4">
        <h2 className="text-xl font-bold text-white">Repository Not Found</h2>
        <Link to="/repositories" className="text-brand-400 hover:underline text-sm">
          Return to Repositories
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/repositories"
          className="inline-flex items-center gap-2 text-xs font-mono text-dark-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Repositories</span>
        </Link>
      </div>

      {/* Repository Header Box */}
      <div className="bg-dark-surface border border-dark-border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <FolderGit2 className="w-6 h-6 text-brand-400" />
              <span>{repo.fullName}</span>
            </h1>
            <p className="text-xs text-dark-muted font-mono">
              Default branch: <span className="text-slate-300">{repo.defaultBranch}</span>
            </p>
          </div>
          <div>
            <a
              href={repo.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-dark-bg border border-dark-border hover:border-slate-600 text-slate-200 text-xs font-medium transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open on GitHub</span>
            </a>
          </div>
        </div>

        {/* Webhook Configuration Instructions for this repo */}
        <div className="p-3.5 rounded-lg bg-dark-bg border border-dark-border/80 text-xs space-y-1 font-mono">
          <div className="text-slate-300 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>GitHub Webhook Integration</span>
          </div>
          <p className="text-dark-muted text-[11px]">
            Payload URL: <code className="text-brand-400">http://&lt;your-host&gt;/api/webhooks/github</code> | Content-type: <code className="text-slate-300">application/json</code> | Events: <code className="text-slate-300">pull_request</code>
          </p>
        </div>
      </div>

      {/* Pull Requests List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <GitPullRequest className="w-4 h-4 text-brand-400" />
            <span>Pull Requests ({repo.pullRequests?.length || 0})</span>
          </h2>
        </div>

        {repo.pullRequests?.length === 0 ? (
          <EmptyState
            icon={GitPullRequest}
            title="No Pull Requests in this Repository"
            description="When a pull request is opened on GitHub, it will appear here with an isolated Docker preview environment."
          />
        ) : (
          <div className="space-y-3">
            {repo.pullRequests.map((pr) => (
              <PullRequestCard key={pr.id} pr={pr} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
