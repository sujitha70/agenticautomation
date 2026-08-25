import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute';
import AppShell from '../components/AppShell/AppShell';
import api from '../lib/api';
import {
  Layers,
  Mail,
  MessageSquare,
  Send,
  Table,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Link,
  Unlink,
  Loader2,
  Settings2,
  ShieldCheck,
  Zap,
} from 'lucide-react';

const ICON_MAP = {
  gmail: Mail,
  slack: MessageSquare,
  discord: Send,
  'google-sheets': Table,
  openrouter: Sparkles,
  gemini: Sparkles,
};

export default function IntegrationsPage() {
  const router = useRouter();
  const { connected, error: queryError } = router.query;

  const [integrations, setIntegrations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [testingProvider, setTestingProvider] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [activeModalProvider, setActiveModalProvider] = useState(null);
  const [manualToken, setManualToken] = useState('');
  const [extraConfig, setExtraConfig] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchIntegrations = async () => {
    try {
      const [listRes, summaryRes] = await Promise.all([
        api.get('/integrations'),
        api.get('/integrations/status'),
      ]);
      setIntegrations(listRes.data.integrations || []);
      setSummary(summaryRes.data.summary);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  useEffect(() => {
    if (connected) {
      setActionSuccess(`Successfully connected ${connected} integration!`);
      setTimeout(() => setActionSuccess(''), 4000);
    }
  }, [connected]);

  const handleOAuthConnect = async (provider) => {
    try {
      const res = await api.get(`/integrations/oauth/${provider}/start`);
      if (res.data.authUrl) {
        window.location.href = res.data.authUrl;
      }
    } catch (err) {
      alert(`OAuth Start failed: ${err.message}`);
    }
  };

  const handleTestConnection = async (provider) => {
    setTestingProvider(provider);
    try {
      const res = await api.post(`/integrations/${provider}/test`);
      setTestResults((prev) => ({
        ...prev,
        [provider]: { success: true, message: res.data.message || 'Connection verified healthy.' }
      }));
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message;
      setTestResults((prev) => ({
        ...prev,
        [provider]: { success: false, message: errorMsg }
      }));
    } finally {
      setTestingProvider(null);
    }
  };

  const handleDisconnect = async (provider) => {
    if (confirm(`Disconnect ${provider} integration?`)) {
      try {
        await api.delete(`/integrations/${provider}`);
        fetchIntegrations();
      } catch (_) {}
    }
  };

  const handleSaveManualConfig = async (e) => {
    e.preventDefault();
    if (!activeModalProvider) return;
    try {
      let parsedConfig = {};
      if (extraConfig) {
        try { parsedConfig = JSON.parse(extraConfig); } catch (_) { parsedConfig = { custom: extraConfig }; }
      }
      await api.post('/integrations', {
        provider: activeModalProvider,
        accessToken: manualToken,
        config: parsedConfig,
      });
      setActiveModalProvider(null);
      setManualToken('');
      setExtraConfig('');
      fetchIntegrations();
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell title="Third-Party Integrations">
        <Head>
          <title>Integrations | Agentflow_AI</title>
        </Head>

        <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Connected Tools & OAuth Integrations
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  AES-256 ENCRYPTED
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Manage OAuth tokens and credentials. Missing credentials trigger explicit INTEGRATION_NOT_CONNECTED events in agent execution timelines.
              </p>
            </div>

            {summary && (
              <div className="flex items-center space-x-3 text-xs font-mono">
                <div className="px-3 py-1.5 rounded-xl bg-[#0c101c] border border-[#1e2638] flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300">
                    {summary.connectedCount} of {summary.totalProviders} Connected
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Success / Error Banners */}
          {actionSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {queryError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>OAuth Error: {decodeURIComponent(queryError)}</span>
            </div>
          )}

          {/* Providers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((item) => {
              const Icon = ICON_MAP[item.provider] || Layers;
              const isConnected = item.status === 'connected';
              const testResult = testResults[item.provider];

              return (
                <div
                  key={item.provider}
                  className={`p-6 rounded-2xl bg-[#0c101c] border transition-all flex flex-col justify-between space-y-4 ${
                    isConnected ? 'border-indigo-500/30 shadow-md' : 'border-[#1e2638]'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row */}
                    <div className="flex items-start justify-between">
                      <div className="p-3 rounded-xl bg-[#131929] border border-white/5 text-indigo-400">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${
                          isConnected
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
                        }`}
                      >
                        {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-slate-100">{item.name}</h3>
                      <p className="text-xs text-slate-400 leading-relaxed mt-1">{item.description}</p>
                    </div>

                    {/* Config / Email Pill */}
                    {isConnected && item.config && Object.keys(item.config).length > 0 && (
                      <div className="p-2.5 rounded-lg bg-[#111728] border border-[#1e273c] text-[11px] font-mono text-slate-300 space-y-0.5">
                        {item.config.email && <div>Account: {item.config.email}</div>}
                        {item.config.teamName && <div>Workspace: {item.config.teamName}</div>}
                        {item.config.guildName && <div>Server: {item.config.guildName}</div>}
                        {item.config.model && <div>Model: {item.config.model}</div>}
                      </div>
                    )}

                    {/* Test result message */}
                    {testResult && (
                      <div
                        className={`p-2.5 rounded-lg text-xs font-mono flex items-start space-x-2 ${
                          testResult.success
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                        }`}
                      >
                        {testResult.success ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400 mt-0.5 flex-shrink-0" />
                        )}
                        <span className="text-[11px] leading-tight">{testResult.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-[#1a2236] flex items-center justify-between gap-2">
                    {isConnected ? (
                      <>
                        <button
                          onClick={() => handleTestConnection(item.provider)}
                          disabled={testingProvider === item.provider}
                          className="px-3 py-1.5 rounded-xl bg-[#131929] hover:bg-[#182035] border border-[#222d42] text-slate-300 hover:text-white text-xs font-mono flex items-center space-x-1.5 transition-colors"
                        >
                          {testingProvider === item.provider ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Zap className="w-3 h-3 text-amber-400" />
                          )}
                          <span>Test</span>
                        </button>

                        <button
                          onClick={() => handleDisconnect(item.provider)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-mono flex items-center space-x-1.5 transition-colors"
                        >
                          <Unlink className="w-3 h-3" />
                          <span>Disconnect</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleOAuthConnect(item.provider)}
                          className="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-xs font-semibold text-white shadow-md shadow-indigo-500/20 flex items-center justify-center space-x-1.5 transition-all"
                        >
                          <Link className="w-3.5 h-3.5" />
                          <span>Connect {item.name}</span>
                        </button>

                        <button
                          onClick={() => setActiveModalProvider(item.provider)}
                          className="p-2 rounded-xl bg-[#131929] hover:bg-[#182035] border border-[#222d42] text-slate-400 hover:text-slate-200"
                          title="Manual Token Input"
                        >
                          <Settings2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Manual Credential Configuration Modal */}
          {activeModalProvider && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveModalProvider(null)} />
              <div className="relative w-full max-w-lg bg-[#0e1322] border border-[#1e273c] rounded-2xl p-6 shadow-2xl z-10 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#1e273c]">
                  <h3 className="font-bold text-base text-slate-100">
                    Configure {activeModalProvider.toUpperCase()} Credentials
                  </h3>
                  <button onClick={() => setActiveModalProvider(null)} className="text-slate-400 hover:text-white">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveManualConfig} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-medium text-slate-300">Access Token / API Key / Bot Token</label>
                    <input
                      type="password"
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      placeholder="Paste secret token..."
                      className="w-full bg-[#131929] border border-[#222d42] rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <p className="text-[10px] text-slate-400">
                      Tokens are encrypted at rest with AES-256 application master key.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-medium text-slate-300">Extra Configuration (JSON / Channel / Sheet ID)</label>
                    <textarea
                      rows={3}
                      value={extraConfig}
                      onChange={(e) => setExtraConfig(e.target.value)}
                      placeholder='{"channel": "#ops-alerts", "spreadsheetId": "..."}'
                      className="w-full bg-[#131929] border border-[#222d42] rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModalProvider(null)}
                      className="px-4 py-2 rounded-xl bg-[#131929] border border-[#222d42] text-slate-300 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md"
                    >
                      Save Configuration
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
