import React from 'react';
import { CheckCircle2, Circle, Loader2, XCircle, AlertCircle } from 'lucide-react';

export default function EnvironmentTimeline({ status, hasIssues, isMerged, isClosed }) {
  const normalized = (status || 'QUEUED').toUpperCase();

  // Define progression steps
  const steps = [
    { key: 'detected', label: 'PR Detected' },
    { key: 'queued', label: 'Environment Queued' },
    { key: 'building', label: 'Image Building' },
    { key: 'starting', label: 'Container Starting' },
    { key: 'health', label: 'Health Check' },
    { key: 'running', label: 'Preview Ready' },
    { key: 'testing', label: 'Reviewer Testing' },
    { key: 'issues', label: 'Issue Reported' },
    { key: 'destroyed', label: 'Environment Destroyed' }
  ];

  // Helper to determine step status: 'completed', 'active', 'failed', 'pending'
  function getStepState(index) {
    if (normalized === 'FAILED') {
      if (index === 0 || index === 1) return 'completed';
      if (index === 2) return 'failed';
      return 'pending';
    }

    if (normalized === 'DESTROYED') {
      return 'completed';
    }

    if (normalized === 'STOPPING') {
      if (index <= 5) return 'completed';
      if (index === 8) return 'active';
      return 'pending';
    }

    switch (normalized) {
      case 'QUEUED':
        if (index === 0) return 'completed';
        if (index === 1) return 'active';
        return 'pending';
      case 'BUILDING':
        if (index <= 1) return 'completed';
        if (index === 2) return 'active';
        return 'pending';
      case 'STARTING':
        if (index <= 2) return 'completed';
        if (index === 3) return 'active';
        return 'pending';
      case 'RUNNING':
        if (index <= 4) return 'completed';
        if (index === 5) return 'completed';
        if (index === 6) return 'active';
        if (index === 7) return hasIssues ? 'completed' : 'pending';
        return 'pending';
      default:
        return 'pending';
    }
  }

  return (
    <div className="bg-dark-surface border border-dark-border rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-200">Environment Timeline</h3>
        <span className="text-xs font-mono text-dark-muted">Status: {normalized}</span>
      </div>

      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0">
        {/* Connector Line (Desktop) */}
        <div className="hidden md:block absolute top-4 left-4 right-4 h-0.5 bg-dark-border -z-0" />

        {steps.map((step, idx) => {
          const state = getStepState(idx);
          return (
            <div key={step.key} className="relative z-10 flex md:flex-col items-center gap-3 md:gap-2 flex-1 text-left md:text-center">
              {/* Icon Container */}
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-dark-surface border-2 transition-all">
                {state === 'completed' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-950" />
                )}
                {state === 'active' && (
                  <Loader2 className="w-5 h-5 text-brand-400 animate-spin" />
                )}
                {state === 'failed' && (
                  <XCircle className="w-5 h-5 text-rose-400 fill-rose-950" />
                )}
                {state === 'pending' && (
                  <Circle className="w-4 h-4 text-slate-600" />
                )}
              </div>

              {/* Label */}
              <div className="text-xs font-medium">
                <span
                  className={
                    state === 'active'
                      ? 'text-brand-400 font-semibold'
                      : state === 'completed'
                      ? 'text-slate-200'
                      : state === 'failed'
                      ? 'text-rose-400 font-semibold'
                      : 'text-dark-muted'
                  }
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
