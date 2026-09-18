import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Github, Layers, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { loginWithGithub, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [error, setError] = useState(null);

  async function handleDemoSignIn() {
    setLoadingDemo(true);
    setError(null);
    try {
      await demoLogin();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoadingDemo(false);
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-dark-surface border border-dark-border rounded-2xl p-8 shadow-2xl space-y-6">
        {/* Logo & Title */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-sky-700 flex items-center justify-center mx-auto shadow-lg shadow-sky-950/40">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome to BuildDeck</h1>
          <p className="text-xs text-dark-muted font-medium">
            Build. Preview. Test. Debug. Merge.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* OAuth Button */}
        <div className="space-y-3">
          <button
            onClick={loginWithGithub}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-slate-100 hover:bg-white text-slate-900 font-semibold text-sm transition-all shadow-md"
          >
            <Github className="w-5 h-5" />
            <span>Continue with GitHub</span>
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-dark-border"></div>
            <span className="flex-shrink mx-4 text-dark-muted text-xs font-mono uppercase">Or</span>
            <div className="flex-grow border-t border-dark-border"></div>
          </div>

          {/* Quick Demo Sign In */}
          <button
            onClick={handleDemoSignIn}
            disabled={loadingDemo}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-dark-bg border border-dark-border hover:border-slate-600 text-slate-200 text-sm font-medium transition-all"
          >
            {loadingDemo ? (
              <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
            <span>Sign In as Demo Reviewer</span>
          </button>
        </div>

        <div className="text-center pt-2">
          <p className="text-[11px] text-dark-muted leading-relaxed">
            By signing in, you connect BuildDeck to review Pull Requests with isolated Docker preview environments.
          </p>
        </div>
      </div>
    </div>
  );
}
