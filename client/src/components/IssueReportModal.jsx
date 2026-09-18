import React, { useState } from 'react';
import { X, Bug, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import api, { clientActivityLog } from '../services/api';

export default function IssueReportModal({ isOpen, onClose, pullRequestId, previewUrl, onCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [severity, setSeverity] = useState('HIGH');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title || !description) {
      setError('Title and Description are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Automatically capture client browser context
    const browserInfo = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    try {
      const res = await api.post(`/pull-requests/${pullRequestId}/issues`, {
        title,
        description,
        stepsToReproduce,
        expectedBehavior,
        actualBehavior,
        severity,
        currentUrl: previewUrl || window.location.href,
        userAgent: navigator.userAgent,
        browserInfo,
        clientActivity: clientActivityLog
      });

      if (onCreated) onCreated(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to submit issue report.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-dark-surface border border-dark-border rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Bug className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Report Preview Bug</h3>
              <p className="text-xs text-dark-muted">Technical debugging context will be attached automatically.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-dark-muted hover:text-white p-1 rounded-lg hover:bg-dark-bg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-950/70 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Issue Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Login form returns 500 on empty credentials"
              className="w-full text-sm bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white placeholder-dark-muted focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Severity */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Severity Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((sev) => (
                <button
                  type="button"
                  key={sev}
                  onClick={() => setSeverity(sev)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                    severity === sev
                      ? sev === 'CRITICAL'
                        ? 'bg-rose-900 border-rose-600 text-white'
                        : sev === 'HIGH'
                        ? 'bg-orange-900 border-orange-600 text-white'
                        : sev === 'MEDIUM'
                        ? 'bg-amber-900 border-amber-600 text-white'
                        : 'bg-blue-900 border-blue-600 text-white'
                      : 'bg-dark-bg border-dark-border text-dark-muted hover:text-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Description *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue encountered during preview testing..."
              className="w-full text-sm bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white placeholder-dark-muted focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Steps to Reproduce */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Steps to Reproduce
            </label>
            <textarea
              rows={3}
              value={stepsToReproduce}
              onChange={(e) => setStepsToReproduce(e.target.value)}
              placeholder="1. Open preview URL&#10;2. Click on submit without filling form&#10;3. Observe response"
              className="w-full text-sm bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white placeholder-dark-muted focus:outline-none focus:border-brand-500 font-mono text-xs"
            />
          </div>

          {/* Expected vs Actual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Expected Behavior
              </label>
              <textarea
                rows={2}
                value={expectedBehavior}
                onChange={(e) => setExpectedBehavior(e.target.value)}
                placeholder="Returns 400 Bad Request with error message"
                className="w-full text-sm bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white placeholder-dark-muted focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Actual Behavior
              </label>
              <textarea
                rows={2}
                value={actualBehavior}
                onChange={(e) => setActualBehavior(e.target.value)}
                placeholder="Crashes with HTTP 500 unhandled exception"
                className="w-full text-sm bg-dark-bg border border-dark-border rounded-lg px-3 py-2 text-white placeholder-dark-muted focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Auto-captured Context Notice */}
          <div className="p-3 rounded-lg bg-dark-bg/90 border border-dark-border text-xs space-y-1">
            <div className="font-semibold text-brand-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Automated Debugging Context Capture</span>
            </div>
            <p className="text-dark-muted text-[11px] leading-relaxed">
              BuildDeck will automatically capture the exact PR commit SHA, container ID, browser environment, recent container logs, and redacted network API activity.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-dark-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-dark-bg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold shadow-lg shadow-rose-950/40 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting & Capturing...</span>
                </>
              ) : (
                <>
                  <Bug className="w-4 h-4" />
                  <span>Report Bug</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
