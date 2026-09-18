import React from 'react';

export default function MetricCard({ title, value, icon: Icon, color = 'brand', subtitle }) {
  const colorStyles = {
    brand: 'border-brand-500/30 text-brand-400 bg-brand-500/10',
    emerald: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    amber: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
    rose: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
    purple: 'border-purple-500/30 text-purple-400 bg-purple-500/10'
  };

  const badgeStyle = colorStyles[color] || colorStyles.brand;

  return (
    <div className="bg-dark-surface border border-dark-border rounded-xl p-5 shadow-sm hover:border-slate-700 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-dark-muted font-mono">{title}</span>
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${badgeStyle}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-white">{value}</span>
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-dark-muted">{subtitle}</p>
      )}
    </div>
  );
}
