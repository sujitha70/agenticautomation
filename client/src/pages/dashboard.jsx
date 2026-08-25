import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../components/AppShell/AppShell';
import MetricGrid from '../components/MetricGrid/MetricGrid';
import AgentBadge from '../components/ExecutionTimeline/AgentBadge';
import api from '../lib/api';
import { formatDate, formatDuration, getStatusBadge } from '../lib/utils';
import {
  Sparkles,
  Plus,
  Play,
  ArrowUpRight,
  Activity,
  Workflow,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Terminal,
  Zap,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/workflows/dashboard');
      setData(res.data.data);
      setIsLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const metrics = data?.metrics || {};
  const recentWorkflows = data?.recentWorkflows || [];
  const recentExecutions = data?.recentExecutions || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <ProtectedRoute>
      <AppShell title="Operations Dashboard">
        <Head>
          <title>Dashboard | Agentflow_AI</title>
        </Head>

        <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Operations Console
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  LIVE TELEMETRY
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Monitor multi-agent execution pipelines, trigger automated workflows, and audit reasoning steps.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <a
                href="/workflows/builder"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 flex items-center space-x-2 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Prompt Generator</span>
              </a>
            </div>
          </div>

          {/* Metric Grid Cards */}
          <MetricGrid metrics={metrics} />

          {/* 2-Column Split: Active Workflows & Live AI Activity Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Workflows & Recent Executions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Workflows List Card */}
              <div className="p-5 rounded-2xl bg-[#0c101c] border border-[#1e2638] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Workflow className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-semibold text-sm text-slate-100">Workflows on Canvas</h3>
                  </div>
                  <a
                    href="/workflows/builder"
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1"
                  >
                    <span>+ New Workflow</span>
                  </a>
                </div>

                {recentWorkflows.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-[#111728]/50 border border-dashed border-[#1e273c] space-y-2">
                    <Sparkles className="w-8 h-8 text-indigo-400 mx-auto opacity-75" />
                    <p className="text-xs font-medium text-slate-300">No workflows created yet.</p>
                    <p className="text-[11px] text-slate-400">Generate your first automation from natural language prompt.</p>
                    <a
                      href="/workflows/builder"
                      className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-indigo-600 text-xs text-white font-medium"
                    >
                      Open AI Builder
                    </a>
                  </div>
                ) : (
                  <div className="divide-y divide-[#172033]">
                    {recentWorkflows.map((wf) => {
                      const id = wf._id || wf.id;
                      const nodeCount = wf.nodes?.length || 0;
                      return (
                        <div
                          key={id}
                          className="py-3.5 flex items-center justify-between group hover:bg-[#111728]/50 px-2 rounded-xl transition-all"
                        >
                          <div className="space-y-1 min-w-0 pr-4">
                            <div className="flex items-center space-x-2">
                              <a
                                href={`/workflows/${id}`}
                                className="font-medium text-xs text-slate-200 group-hover:text-indigo-300 truncate"
                              >
                                {wf.name}
                              </a>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                v{wf.version || 1}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate max-w-md">
                              {wf.description || 'Configured automation pipeline'}
                            </p>
                          </div>

                          <div className="flex items-center space-x-3 flex-shrink-0">
                            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                              {nodeCount} Nodes
                            </span>
                            <a
                              href={`/workflows/${id}`}
                              className="p-2 rounded-lg bg-[#141b2e] hover:bg-indigo-600/20 text-indigo-400 border border-[#222d42] hover:border-indigo-500/40 text-xs flex items-center space-x-1.5 transition-all"
                              title="Open Editor"
                            >
                              <span>Canvas</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent Executions Summary */}
              <div className="p-5 rounded-2xl bg-[#0c101c] border border-[#1e2638] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-purple-400" />
                    <h3 className="font-semibold text-sm text-slate-100">Recent Orchestration Runs</h3>
                  </div>
                  <a
                    href="/executions"
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-mono"
                  >
                    View All Executions →
                  </a>
                </div>

                {recentExecutions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 font-mono">
                    NO EXECUTIONS LOGGED YET
                  </div>
                ) : (
                  <div className="divide-y divide-[#172033]">
                    {recentExecutions.map((exec) => {
                      const id = exec._id || exec.id;
                      const badge = getStatusBadge(exec.status);
                      return (
                        <div
                          key={id}
                          className="py-3 flex items-center justify-between hover:bg-[#111728]/50 px-2 rounded-xl transition-all"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-xs text-slate-200">
                                {exec.workflowSnapshot?.name || 'Automation Run'}
                              </span>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${badge.color}`}>
                                {badge.label}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">
                              {formatDate(exec.createdAt)} • {formatDuration(exec.duration)}
                            </span>
                          </div>

                          <a
                            href={`/executions?id=${id}`}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 text-xs flex items-center gap-1 font-mono"
                          >
                            <span>Timeline</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: AI Reasoning Feed */}
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-[#0c101c] border border-[#1e2638] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <h3 className="font-semibold text-sm text-slate-100">Live Agent Reasoning Feed</h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 animate-pulse">
                    STREAMING
                  </span>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {recentActivity.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400 font-mono">
                      AWAITING AGENT EVENTS...
                    </div>
                  ) : (
                    recentActivity.map((log, idx) => (
                      <div
                        key={log.id || log._id || idx}
                        className="p-3 rounded-xl bg-[#101524] border border-[#1d263b] space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <AgentBadge agent={log.agent} />
                          <span className="text-[10px] font-mono text-slate-400">
                            {formatDate(log.timestamp || log.createdAt)}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          {log.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
