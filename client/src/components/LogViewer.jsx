import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Search, Copy, Check, ArrowDownCircle, RefreshCw } from 'lucide-react';

export default function LogViewer({ logs = [], title = 'Live Container Logs', isLive = false }) {
  const [filter, setFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const consoleBottomRef = useRef(null);

  useEffect(() => {
    if (autoScroll && consoleBottomRef.current) {
      consoleBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    const text = typeof log === 'string' ? log : log.message || '';
    const level = log.level || 'INFO';
    const matchesText = text.toLowerCase().includes(filter.toLowerCase());
    const matchesLevel = levelFilter === 'ALL' || level === levelFilter;
    return matchesText && matchesLevel;
  });

  function copyAllLogs() {
    const fullText = logs
      .map(l => (typeof l === 'string' ? l : `[${l.timestamp || ''}] [${l.level || 'INFO'}] [${l.source || ''}] ${l.message}`))
      .join('\n');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-[#0c1017] border border-dark-border rounded-xl overflow-hidden shadow-lg flex flex-col h-[480px]">
      {/* Console Header Bar */}
      <div className="bg-dark-surface/90 px-4 py-2.5 border-b border-dark-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-brand-400" />
          <span className="text-xs font-semibold text-slate-200 font-mono">{title}</span>
          {isLive && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              LIVE STREAM
            </span>
          )}
          <span className="text-[11px] text-dark-muted font-mono">({filteredLogs.length} lines)</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Level selector */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="text-xs bg-dark-bg border border-dark-border rounded px-2 py-1 text-slate-300 focus:outline-none focus:border-brand-500 font-mono"
          >
            <option value="ALL">All Levels</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="ERROR">ERROR</option>
          </select>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-dark-muted" />
            <input
              type="text"
              placeholder="Filter logs..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-xs bg-dark-bg border border-dark-border rounded pl-8 pr-2.5 py-1 text-slate-200 placeholder-dark-muted focus:outline-none focus:border-brand-500 font-mono w-32 sm:w-48"
            />
          </div>

          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1.5 rounded border text-xs transition-colors ${
              autoScroll
                ? 'bg-brand-500/20 text-brand-400 border-brand-500/40'
                : 'bg-dark-bg text-dark-muted border-dark-border hover:text-slate-200'
            }`}
            title={autoScroll ? 'Auto-scroll enabled' : 'Auto-scroll paused'}
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
          </button>

          {/* Copy logs */}
          <button
            onClick={copyAllLogs}
            className="p-1.5 bg-dark-bg border border-dark-border hover:border-slate-600 rounded text-slate-300 hover:text-white transition-colors"
            title="Copy logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-1 select-text">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-dark-muted italic">
            No logs available matching current filter.
          </div>
        ) : (
          filteredLogs.map((log, index) => {
            const isObj = typeof log === 'object';
            const message = isObj ? log.message : log;
            const level = isObj ? log.level : 'INFO';
            const timestamp = isObj && log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '';
            const source = isObj ? log.source : 'system';

            let colorClass = 'text-slate-300';
            if (level === 'ERROR' || message.includes('[ERROR]') || message.includes('failed')) {
              colorClass = 'text-rose-400';
            } else if (level === 'WARN' || message.includes('[WARN]')) {
              colorClass = 'text-amber-300';
            } else if (source === 'build') {
              colorClass = 'text-sky-300';
            } else if (source === 'docker') {
              colorClass = 'text-emerald-300';
            }

            return (
              <div key={index} className="flex items-start gap-2 hover:bg-white/5 py-0.5 px-1 rounded">
                <span className="text-slate-600 select-none text-[11px] w-8 text-right">{index + 1}</span>
                {timestamp && <span className="text-slate-500 text-[11px] select-none">[{timestamp}]</span>}
                {isObj && source && (
                  <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-400 select-none uppercase">
                    {source}
                  </span>
                )}
                <span className={`break-all ${colorClass}`}>{message}</span>
              </div>
            );
          })
        )}
        <div ref={consoleBottomRef} />
      </div>
    </div>
  );
}
