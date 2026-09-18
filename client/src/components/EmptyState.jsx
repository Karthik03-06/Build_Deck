import React from 'react';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-16 px-4 bg-dark-surface/40 border border-dark-border/60 rounded-2xl">
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-dark-bg border border-dark-border flex items-center justify-center mx-auto mb-4 text-dark-muted">
          <Icon className="w-6 h-6 text-brand-400" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-200">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-dark-muted max-w-sm mx-auto">{description}</p>
      )}
      {action && (
        <div className="mt-5">{action}</div>
      )}
    </div>
  );
}
