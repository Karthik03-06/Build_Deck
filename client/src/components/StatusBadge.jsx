import React from 'react';
import { Play, Loader2, CheckCircle2, XCircle, AlertTriangle, StopCircle, Clock, Check } from 'lucide-react';

export default function StatusBadge({ status, type = 'environment', className = '' }) {
  if (!status) return null;

  const normalized = status.toUpperCase();

  // Environment Statuses
  if (type === 'environment') {
    switch (normalized) {
      case 'QUEUED':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700 ${className}`}>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            QUEUED
          </span>
        );
      case 'BUILDING':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-950/60 text-amber-300 border border-amber-800/60 ${className}`}>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
            BUILDING
          </span>
        );
      case 'STARTING':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-950/60 text-blue-300 border border-blue-800/60 ${className}`}>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
            STARTING
          </span>
        );
      case 'RUNNING':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 shadow-sm shadow-emerald-900/30 ${className}`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            RUNNING
          </span>
        );
      case 'FAILED':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-950/70 text-rose-300 border border-rose-800/70 ${className}`}>
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            FAILED
          </span>
        );
      case 'STOPPING':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-950/70 text-orange-300 border border-orange-800/70 ${className}`}>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-400" />
            STOPPING
          </span>
        );
      case 'DESTROYED':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-900 text-slate-400 border border-slate-800 ${className}`}>
            <StopCircle className="w-3.5 h-3.5 text-slate-500" />
            DESTROYED
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300 ${className}`}>
            {status}
          </span>
        );
    }
  }

  // PR Statuses
  if (type === 'pr') {
    switch (normalized) {
      case 'OPEN':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800 ${className}`}>
            <Play className="w-3 h-3 fill-current" />
            Open
          </span>
        );
      case 'MERGED':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-950 text-purple-300 border border-purple-800 ${className}`}>
            <Check className="w-3 h-3" />
            Merged
          </span>
        );
      case 'CLOSED':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-950 text-rose-400 border border-rose-800 ${className}`}>
            <XCircle className="w-3 h-3" />
            Closed
          </span>
        );
      default:
        return <span className="text-xs text-slate-400">{status}</span>;
    }
  }

  // Issue Severity
  if (type === 'severity') {
    switch (normalized) {
      case 'CRITICAL':
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-900/70 text-red-200 border border-red-700 ${className}`}>
            <AlertTriangle className="w-3 h-3" />
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-950 text-orange-300 border border-orange-800 ${className}`}>
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-950 text-amber-300 border border-amber-800 ${className}`}>
            MEDIUM
          </span>
        );
      case 'LOW':
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-950 text-blue-300 border border-blue-800 ${className}`}>
            LOW
          </span>
        );
      default:
        return <span className="text-xs text-slate-400">{status}</span>;
    }
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300 ${className}`}>
      {status}
    </span>
  );
}
