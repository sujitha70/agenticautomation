import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export function formatDuration(ms) {
  if (!ms || ms <= 0) return '0ms';
  if (ms < 1000) return `${ms}ms`;
  const sec = (ms / 1000).toFixed(1);
  return `${sec}s`;
}

export function getAgentColor(agentName) {
  const map = {
    planner: { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' },
    execution: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' },
    validation: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
    recovery: { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' },
    monitoring: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    orchestrator: { bg: 'bg-indigo-500/15', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  };
  return map[agentName?.toLowerCase()] || { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' };
}

export function getStatusBadge(status) {
  switch (status) {
    case 'COMPLETED':
      return { label: 'Completed', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
    case 'RUNNING':
      return { label: 'Running', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse' };
    case 'PENDING':
      return { label: 'Queued', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30' };
    case 'PAUSED':
      return { label: 'Paused', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    case 'RETRYING':
      return { label: 'Retrying', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30 animate-pulse' };
    case 'CANCELLED':
      return { label: 'Cancelled', color: 'bg-slate-700/40 text-slate-400 border-slate-600/30' };
    case 'FAILED':
    default:
      return { label: 'Failed', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
  }
}
