import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Layers, 
  GitPullRequest, 
  Box, 
  Globe, 
  Bug, 
  GitMerge, 
  ArrowRight, 
  CheckCircle2, 
  Terminal, 
  ShieldCheck, 
  Zap, 
  Server 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user, demoLogin } = useAuth();

  const workflowSteps = [
    {
      step: '01',
      title: 'Pull Request Opened',
      desc: 'GitHub sends webhook with exact commit SHA. BuildDeck validates HMAC and creates isolated preview record.',
      icon: GitPullRequest
    },
    {
      step: '02',
      title: 'Docker Image Built',
      desc: 'PR source code is built with repository Dockerfile. Resource limits and Traefik routing labels applied.',
      icon: Box
    },
    {
      step: '03',
      title: 'Live Preview Ready',
      desc: 'Traefik routes pr-X.preview.localhost to the container. Reviewers test the live application in the browser.',
      icon: Globe
    },
    {
      step: '04',
      title: 'Debug Context Captured',
      desc: 'Reviewer reports a bug. Exact commit SHA, container logs, browser environment, and API requests are captured.',
      icon: Bug
    },
    {
      step: '05',
      title: 'Merge & Auto Cleanup',
      desc: 'PR merged or closed. Container is gracefully stopped, removed, and routing freed automatically.',
      icon: GitMerge
    }
  ];

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Top Bar */}
      <header className="border-b border-dark-border/80 bg-dark-surface/60 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">BuildDeck</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              v1.0 Demo
            </span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-all"
              >
                Go to Dashboard
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={demoLogin}
                  className="text-xs font-mono px-3 py-1.5 rounded-lg border border-dark-border hover:border-slate-600 text-slate-300 transition-colors"
                >
                  Quick Demo Login
                </button>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-all"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 max-w-5xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono bg-brand-500/10 text-brand-400 border border-brand-500/30">
          <Zap className="w-3.5 h-3.5" />
          <span>Real Docker Previews + Reproducible Debugging</span>
          <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold rounded bg-brand-500/20 text-brand-300 border border-brand-500/40">
            Live PR Demo
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
          Build. Preview. Test. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-sky-300 to-indigo-400">
            Debug. Merge.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-dark-muted max-w-2xl mx-auto leading-relaxed">
          BuildDeck turns every GitHub Pull Request into an isolated, browser-accessible Docker preview environment with real-time log streaming and reproducible debugging context.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-base font-semibold shadow-xl shadow-brand-950/50 transition-all group"
          >
            <span>Launch Dashboard</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-dark-surface hover:bg-dark-card border border-dark-border text-slate-200 text-base font-semibold transition-all"
          >
            <Server className="w-4 h-4 text-brand-400" />
            <span>Infrastructure Status</span>
          </Link>
        </div>
      </section>

      {/* End-to-End Workflow Graphic */}
      <section className="py-12 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-2xl font-bold text-white">How BuildDeck Works</h2>
          <p className="text-sm text-dark-muted">Automated container lifecycle from Pull Request opened to merged.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {workflowSteps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.step}
                className="bg-dark-surface border border-dark-border rounded-xl p-5 relative overflow-hidden flex flex-col justify-between hover:border-slate-600 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-brand-400">{s.step}</span>
                    <div className="w-7 h-7 rounded-lg bg-dark-bg border border-dark-border flex items-center justify-center text-slate-300">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100">{s.title}</h3>
                  <p className="text-xs text-dark-muted leading-relaxed">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Differentiator: Reproducible Debugging */}
      <section className="py-16 px-6 max-w-5xl mx-auto w-full">
        <div className="bg-gradient-to-br from-dark-surface to-dark-card border border-dark-border rounded-2xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-semibold bg-rose-950/80 text-rose-300 border border-rose-800">
              <Bug className="w-3.5 h-3.5" />
              <span>Core Innovation</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Never ask “what commit was that on?” again.
            </h2>
            <p className="text-sm text-dark-muted leading-relaxed">
              When a reviewer spots a bug in a preview, BuildDeck automatically captures the exact commit SHA, container ID, recent container logs, user browser metrics, and redacted API activity. Developers can reproduce the issue using that exact historical commit with a single click.
            </p>
            <div className="pt-2">
              <Link
                to="/issues"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-400 hover:text-brand-300 transition-colors"
              >
                <span>Explore Reproducible Issues</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-dark-border/80 py-8 px-6 text-center text-xs text-dark-muted font-mono">
        <p>BuildDeck — GitHub-integrated collaborative Pull Request preview and debugging platform.</p>
      </footer>
    </div>
  );
}
