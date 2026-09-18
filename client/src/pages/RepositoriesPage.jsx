import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderGit2, Plus, ExternalLink, GitPullRequest, Box, Check, Loader2, X } from 'lucide-react';
import api from '../services/api';
import EmptyState from '../components/EmptyState';

export default function RepositoriesPage() {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [repoFullName, setRepoFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRepositories();
  }, []);

  async function fetchRepositories() {
    try {
      const res = await api.get('/repos');
      setRepositories(res.data);
    } catch (err) {
      console.error('Failed to load repositories:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect(e) {
    e.preventDefault();
    if (!repoFullName.includes('/')) {
      setError('Please provide format: owner/repository (e.g. facebook/react)');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/repos/connect', { fullName: repoFullName });
      setRepoFullName('');
      setIsModalOpen(false);
      fetchRepositories();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect repository');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Connected Repositories</h1>
          <p className="text-xs text-dark-muted font-medium mt-1">
            Repositories monitored for Pull Requests and automated preview environments.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-950/40 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Connect Repository</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center text-brand-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : repositories.length === 0 ? (
        <EmptyState
          icon={FolderGit2}
          title="No Repositories Connected"
          description="Connect a GitHub repository to automatically start building isolated preview environments for Pull Requests."
          action={
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Connect Repository</span>
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {repositories.map((repo) => (
            <div
              key={repo.id}
              className="bg-dark-surface border border-dark-border rounded-xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-white tracking-tight">{repo.fullName}</span>
                  <a
                    href={repo.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-dark-muted hover:text-white"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <p className="text-xs text-dark-muted font-mono">
                  Default Branch: <span className="text-slate-300">{repo.defaultBranch}</span>
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-dark-border text-xs">
                <div className="flex items-center gap-4 text-dark-muted">
                  <span className="flex items-center gap-1">
                    <GitPullRequest className="w-3.5 h-3.5 text-brand-400" />
                    {repo.openPrCount} Open PRs
                  </span>
                  <span className="flex items-center gap-1">
                    <Box className="w-3.5 h-3.5 text-emerald-400" />
                    {repo.activePreviewCount} Running
                  </span>
                </div>
                <Link
                  to={`/repositories/${repo.id}`}
                  className="px-3 py-1 rounded-lg bg-dark-bg border border-dark-border hover:border-brand-500/50 text-slate-200 hover:text-white font-medium transition-colors"
                >
                  View Repo
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Connect Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-dark-surface border border-dark-border rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Connect Repository</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-dark-muted hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-xs text-rose-300">
                {error}
              </div>
            )}

            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Full Name (owner/repo)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. builddeck/sample-preview-app"
                  value={repoFullName}
                  onChange={(e) => setRepoFullName(e.target.value)}
                  className="w-full text-sm bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white placeholder-dark-muted focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs text-dark-muted hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Connect</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
