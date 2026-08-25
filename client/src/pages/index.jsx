import { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuthStore } from '../store/authStore';
import {
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Activity,
  Layers,
  Cpu,
  Mail,
  MessageSquare,
  Table,
  CheckCircle2,
  Lock,
  GitFork,
  Radio,
  Terminal,
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  const FEATURES = [
    {
      icon: Sparkles,
      title: 'Prompt-to-Graph Generation',
      desc: 'Describe automations in natural language and watch LangGraph-ready DAG visual workflows materialize instantly with intelligent node layout.',
      color: 'text-purple-400',
      border: 'border-purple-500/20',
      bg: 'from-purple-500/10 to-transparent',
    },
    {
      icon: Cpu,
      title: 'Cooperating Multi-Agent Mesh',
      desc: 'Planner, Execution, Validation, Recovery, and Monitoring agents work in concert with self-healing retries and exponential backoff.',
      color: 'text-indigo-400',
      border: 'border-indigo-500/20',
      bg: 'from-indigo-500/10 to-transparent',
    },
    {
      icon: Radio,
      title: 'Real-Time Socket Streaming',
      desc: 'Watch each agent step broadcast live to your browser over WebSockets with color-coded telemetry and full execution audit trails.',
      color: 'text-emerald-400',
      border: 'border-emerald-500/20',
      bg: 'from-emerald-500/10 to-transparent',
    },
    {
      icon: Lock,
      title: 'Encrypted OAuth Integrations',
      desc: 'Native OAuth 2.0 with AES-256 encrypted credential tokens at rest for Gmail, Slack, Discord, Google Sheets, OpenRouter, and Gemini.',
      color: 'text-blue-400',
      border: 'border-blue-500/20',
      bg: 'from-blue-500/10 to-transparent',
    },
  ];

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      <Head>
        <title>Agentflow_AI | Agentic AI Operations Automation Platform</title>
      </Head>

      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] pointer-events-none" />

      {/* Top Navbar */}
      <nav className="h-20 border-b border-white/5 bg-[#090d16]/70 backdrop-blur-md sticky top-0 z-50 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-indigo-500/30">
            <div className="w-full h-full bg-[#0b0f1a] rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <span className="font-bold text-lg tracking-tight">
            Agentflow<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">_AI</span>
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <a
            href="/login"
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
          >
            Operator Login
          </a>
          <a
            href="/register"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all flex items-center space-x-1.5"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-24 px-6 max-w-6xl mx-auto text-center space-y-8 relative z-10">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-mono text-indigo-300">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>Next-Gen Agentic Operations Infrastructure</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1]">
          Turn Natural Language into <span className="gradient-text">Autonomous Agentic Workflows</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Describe any operational automation in plain English. Watch it compile into an interactive visual graph executed by cooperating AI agents with self-healing recovery and live WebSocket telemetry.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <a
            href="/workflows/builder"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center space-x-2.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch AI Workflow Builder</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <a
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#111728] hover:bg-[#161e33] border border-[#222d44] text-slate-200 font-semibold text-sm transition-all flex items-center justify-center space-x-2"
          >
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Open Operator Console</span>
          </a>
        </div>

        {/* Live UI Mock Showcase */}
        <div className="pt-10 max-w-5xl mx-auto">
          <div className="p-2 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 shadow-2xl backdrop-blur-xl border border-white/10">
            <div className="rounded-xl bg-[#0b0f1c] border border-[#1e273c] p-4 sm:p-6 space-y-4 text-left">
              {/* Window Header */}
              <div className="flex items-center justify-between border-b border-[#1c2438] pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-mono text-slate-400 pl-2">agentflow-orchestrator://execution/mesh</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  5 AGENTS LIVE
                </span>
              </div>

              {/* Agent Chain Flow Display */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
                {[
                  { name: '1. Planner', role: 'Graph Topology', desc: 'Resolves execution sequence & confidence 98%', color: 'border-sky-500/40 bg-sky-500/10 text-sky-300' },
                  { name: '2. Execution', role: 'Tool Dispatch', desc: 'Routes to Gmail, Slack, Sheets & LLMs', color: 'border-purple-500/40 bg-purple-500/10 text-purple-300' },
                  { name: '3. Validation', role: 'Integrity Check', desc: 'Verifies data contracts & schemas', color: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
                  { name: '4. Recovery', role: 'Auto-Healing', desc: 'Exponential backoff & error triage', color: 'border-rose-500/40 bg-rose-500/10 text-rose-300' },
                  { name: '5. Monitoring', role: 'Observability', desc: 'Emits Socket.IO real-time timeline', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
                ].map((step, idx) => (
                  <div key={idx} className={`p-3 rounded-xl border ${step.color} space-y-1.5`}>
                    <span className="font-mono text-xs font-bold block">{step.name}</span>
                    <span className="text-[10px] font-mono uppercase text-slate-300 block">{step.role}</span>
                    <p className="text-[11px] text-slate-400 leading-snug">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 px-6 max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Engineered for Enterprise Operational Resilience
          </h2>
          <p className="text-sm text-slate-400">Everything needed to run mission-critical AI workflow pipelines.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURES.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className={`p-6 rounded-2xl bg-gradient-to-br ${feat.bg} bg-[#0c101c] border ${feat.border} space-y-3 hover:scale-[1.01] transition-transform`}
              >
                <div className={`p-3 rounded-xl bg-[#121829] w-fit border border-white/5 ${feat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-100">{feat.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Supported Integrations Banner */}
      <section className="py-16 px-6 max-w-5xl mx-auto text-center space-y-6">
        <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400">
          Native Third-Party Tool Integrations
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-6 text-slate-300 font-medium text-sm">
          <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#111728] border border-[#1e273c]">
            <Mail className="w-4 h-4 text-rose-400" />
            <span>Gmail Workspace</span>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#111728] border border-[#1e273c]">
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <span>Slack API</span>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#111728] border border-[#1e273c]">
            <Table className="w-4 h-4 text-emerald-400" />
            <span>Google Sheets v4</span>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#111728] border border-[#1e273c]">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>OpenRouter & Gemini</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-400 font-mono">
        <p>Agentic AI Automation Platform (Agentflow_AI) • Production Ready</p>
      </footer>
    </div>
  );
}
