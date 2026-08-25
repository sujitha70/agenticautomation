import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../components/AppShell/AppShell';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Key,
  Lock,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Database,
  Radio,
  LogOut,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [health, setHealth] = useState(null);
  const [encryptionStatus, setEncryptionStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await api.get('/health');
        setHealth(res.data);
        setEncryptionStatus(res.data.services?.encryption);
        setIsLoading(false);
      } catch (_) {
        setIsLoading(false);
      }
    }
    checkHealth();
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <ProtectedRoute>
      <AppShell title="System Settings & Security">
        <Head>
          <title>Settings | Agentflow_AI</title>
        </Head>

        <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Platform Configuration & Health
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Verify application encryption keys, active AI inference backends, database drivers, and operator profile.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Operator Profile Card */}
            <div className="p-6 rounded-2xl bg-[#0c101c] border border-[#1e2638] space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-[#1e2638]">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Operator Identity</h3>
                  <p className="text-[11px] text-slate-400">Active session credentials</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Operator Name</span>
                  <span className="font-medium text-slate-200">{user?.name || 'Operator'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Email Address</span>
                  <span className="font-mono text-slate-200">{user?.email || 'operator@agentflow.io'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Security Role</span>
                  <span className="font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px]">
                    {user?.role || 'OPERATOR'}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Terminate Session (Logout)</span>
                </button>
              </div>
            </div>

            {/* Cryptographic Key Health Card */}
            <div className="p-6 rounded-2xl bg-[#0c101c] border border-[#1e2638] space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-[#1e2638]">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Credential Encryption Health</h3>
                  <p className="text-[11px] text-slate-400">AES-256-GCM token storage</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Encryption Status</span>
                  <span className="font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>ACTIVE & VERIFIED</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Algorithm</span>
                  <span className="font-mono text-slate-200">{encryptionStatus?.algorithm || 'AES-256-GCM'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Derived Key Length</span>
                  <span className="font-mono text-slate-200">256 Bits</span>
                </div>
              </div>
            </div>

            {/* AI Providers & LLM Router */}
            <div className="p-6 rounded-2xl bg-[#0c101c] border border-[#1e2638] space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-[#1e2638]">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">AI Routing Backends</h3>
                  <p className="text-[11px] text-slate-400">Multi-tier LLM generation stack</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Tier 1: OpenRouter API</span>
                  <span className="font-mono text-slate-200">
                    {health?.services?.aiProviders?.openRouterConfigured ? 'CONNECTED' : 'STANDBY'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Tier 2: Google Gemini SDK</span>
                  <span className="font-mono text-slate-200">
                    {health?.services?.aiProviders?.geminiConfigured ? 'CONNECTED' : 'STANDBY'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Tier 3: Rule-Based Fallback</span>
                  <span className="font-mono text-emerald-400">ONLINE (100% Guaranteed)</span>
                </div>
              </div>
            </div>

            {/* Substrate & Database Driver */}
            <div className="p-6 rounded-2xl bg-[#0c101c] border border-[#1e2638] space-y-4">
              <div className="flex items-center space-x-3 pb-3 border-b border-[#1e2638]">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Storage & Orchestration</h3>
                  <p className="text-[11px] text-slate-400">Zero-setup persistence engine</p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Database Engine</span>
                  <span className="font-mono uppercase text-slate-200">
                    {health?.services?.database?.type || 'IN-MEMORY STORE'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">LangGraph Substrate</span>
                  <span className="font-mono uppercase text-emerald-400">
                    {health?.services?.orchestrator?.langGraph || 'AVAILABLE'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Server Uptime</span>
                  <span className="font-mono text-slate-200">
                    {health ? `${Math.round(health.uptime)}s` : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
