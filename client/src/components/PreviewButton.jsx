import React from 'react';
import { ExternalLink, Play, Loader2, RotateCw, Trash2 } from 'lucide-react';

export default function PreviewButton({
  status,
  previewUrl,
  onLaunch,
  onDestroy,
  isLoading = false,
  className = ''
}) {
  const normalized = (status || '').toUpperCase();

  if (normalized === 'RUNNING' && previewUrl) {
    return (
      <div className="flex items-center gap-2">
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-950/40 transition-all ${className}`}
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open Preview</span>
        </a>
        {onDestroy && (
          <button
            onClick={onDestroy}
            title="Destroy Preview Container"
            className="p-2 rounded-lg bg-dark-bg border border-dark-border hover:border-rose-800 text-dark-muted hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  if (normalized === 'BUILDING') {
    return (
      <button
        disabled
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-950/70 border border-amber-700/60 text-amber-300 text-sm font-medium cursor-not-allowed ${className}`}
      >
        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
        <span>Building Docker Image...</span>
      </button>
    );
  }

  if (normalized === 'STARTING') {
    return (
      <button
        disabled
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-950/70 border border-blue-700/60 text-blue-300 text-sm font-medium cursor-not-allowed ${className}`}
      >
        <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
        <span>Starting & Health Checking...</span>
      </button>
    );
  }

  if (normalized === 'FAILED') {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onLaunch}
          disabled={isLoading}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-950 border border-rose-800 text-rose-300 hover:bg-rose-900 text-sm font-semibold transition-all ${className}`}
        >
          <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Retry Build</span>
        </button>
      </div>
    );
  }

  // Not yet launched / Queued / Destroyed
  return (
    <button
      onClick={onLaunch}
      disabled={isLoading || normalized === 'QUEUED'}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-950/40 transition-all ${className}`}
    >
      {isLoading || normalized === 'QUEUED' ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Provisioning...</span>
        </>
      ) : (
        <>
          <Play className="w-4 h-4 fill-current" />
          <span>Launch Preview</span>
        </>
      )}
    </button>
  );
}
