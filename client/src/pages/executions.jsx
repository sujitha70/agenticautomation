import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../components/AppShell/AppShell';
import ExecutionTimeline from '../components/ExecutionTimeline/ExecutionTimeline';
import { useExecutionStore } from '../store/executionStore';
import { formatDate, formatDuration, getStatusBadge } from '../lib/utils';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  XCircle,
  Clock,
  Terminal,
  Filter,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function ExecutionsPage() {
  const router = useRouter();
  const { id: queryId } = router.query;

  const {
    executions,
    activeExecution,
    timelineLogs,
    fetchExecutions,
    loadExecution,
    pauseExecution,
    resumeExecution,
    cancelExecution,
    retryExecution,
    isLoading,
  } = useExecutionStore();

  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedExecId, setSelectedExecId] = useState(null);

  useEffect(() => {
    fetchExecutions();
    const interval = setInterval(fetchExecutions, 8000);
    return () => clearInterval(interval);
  }, [fetchExecutions]);

  useEffect(() => {
    if (queryId) {
      setSelectedExecId(queryId);
      loadExecution(queryId);
    } else if (executions.length > 0 && !selectedExecId) {
      const firstId = executions[0]._id || executions[0].id;
      setSelectedExecId(firstId);
      loadExecution(firstId);
    }
  }, [queryId, executions, selectedExecId, loadExecution]);

  const handleSelectExecution = (execId) => {
    setSelectedExecId(execId);
    loadExecution(execId);
  };

  const filtered = executions.filter((e) => {
    if (filterStatus === 'ALL') return true;
    return e.status === filterStatus;
  });

  return (
    <ProtectedRoute>
      <AppShell title="Executions & Agent Timeline">
        <Head>
          <title>Executions | Agentflow_AI</title>
        </Head>

        <div className="flex-1 flex flex-col overflow-hidden p-4 lg:p-6 space-y-4 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Execution Observability
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  SOCKET STREAM
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Audit step-by-step multi-agent reasoning, self-healing recovery events, and live pipeline statuses.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-[#0c101c] border border-[#1e2638] text-xs font-mono overflow-x-auto">
              {['ALL', 'RUNNING', 'COMPLETED', 'FAILED', 'PAUSED'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    filterStatus === s
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Master-Detail Split Screen: [List | Live Timeline Details] */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden min-h-[550px]">
            {/* Left Col (5 cols): Executions Master List */}
            <div className="lg:col-span-5 bg-[#0c101c] border border-[#1e2638] rounded-2xl flex flex-col overflow-hidden shadow-sm">
              <div className="p-3.5 border-b border-[#1e2638] flex items-center justify-between bg-[#101524]">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Execution Runs ({filtered.length})
                </span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-[#172033]">
                {filtered.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-400 font-mono">
                    NO EXECUTIONS MATCHING FILTER
                  </div>
                ) : (
                  filtered.map((exec) => {
                    const id = exec._id || exec.id;
                    const isSelected = selectedExecId === id;
                    const badge = getStatusBadge(exec.status);
                    const name = exec.workflowSnapshot?.name || 'Automation Pipeline';

                    return (
                      <div
                        key={id}
                        onClick={() => handleSelectExecution(id)}
                        className={`p-4 cursor-pointer transition-all space-y-1.5 ${
                          isSelected
                            ? 'bg-indigo-600/15 border-l-4 border-indigo-500'
                            : 'hover:bg-[#111728]/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-xs text-slate-100 truncate pr-2">
                            {name}
                          </h4>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span>{formatDate(exec.createdAt)}</span>
                          <span>{formatDuration(exec.duration)}</span>
                        </div>

                        {exec.retryCount > 0 && (
                          <div className="text-[10px] text-amber-400 font-mono flex items-center gap-1">
                            <RotateCcw className="w-3 h-3" />
                            <span>Retries: {exec.retryCount}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Col (7 cols): Execution Detail & Live Timeline */}
            <div className="lg:col-span-7 bg-[#0c101c] border border-[#1e2638] rounded-2xl flex flex-col overflow-hidden shadow-sm">
              {activeExecution ? (
                <>
                  {/* Top Detail Header & Execution Controls */}
                  <div className="p-4 border-b border-[#1e2638] bg-[#101524] flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-sm text-slate-100">
                          {activeExecution.workflowSnapshot?.name || 'Workflow Run'}
                        </h3>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getStatusBadge(activeExecution.status).color}`}>
                          {activeExecution.status}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-slate-400">
                        ID: {activeExecution._id || activeExecution.id} • Started: {formatDate(activeExecution.startedAt)}
                      </p>
                    </div>

                    {/* Operational Actions */}
                    <div className="flex items-center space-x-2">
                      {activeExecution.status === 'RUNNING' && (
                        <>
                          <button
                            onClick={() => pauseExecution(activeExecution._id || activeExecution.id)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-mono flex items-center space-x-1.5"
                          >
                            <Pause className="w-3 h-3" />
                            <span>Pause</span>
                          </button>
                          <button
                            onClick={() => cancelExecution(activeExecution._id || activeExecution.id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center space-x-1.5"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Cancel</span>
                          </button>
                        </>
                      )}

                      {activeExecution.status === 'PAUSED' && (
                        <button
                          onClick={() => resumeExecution(activeExecution._id || activeExecution.id)}
                          className="px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-xs font-mono flex items-center space-x-1.5"
                        >
                          <Play className="w-3 h-3" />
                          <span>Resume</span>
                        </button>
                      )}

                      {(activeExecution.status === 'FAILED' || activeExecution.status === 'CANCELLED' || activeExecution.status === 'COMPLETED') && (
                        <button
                          onClick={() => retryExecution(activeExecution._id || activeExecution.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#141b2e] hover:bg-indigo-600/20 border border-[#222d42] hover:border-indigo-500/40 text-indigo-300 text-xs font-mono flex items-center space-x-1.5 transition-all"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Re-Run</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Timeline Stream Area */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#090d16]/60">
                    <ExecutionTimeline
                      logs={timelineLogs}
                      isLive={activeExecution.status === 'RUNNING' || activeExecution.status === 'RETRYING'}
                    />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-2">
                  <Terminal className="w-8 h-8 text-slate-400" />
                  <p className="text-xs text-slate-400 font-mono">SELECT AN EXECUTION TO VIEW AGENT TELEMETRY</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
