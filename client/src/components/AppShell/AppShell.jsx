import { useState, useEffect } from 'react';
import Link from 'next/router';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { getSocket } from '../../lib/socket';
import {
  LayoutDashboard,
  Sparkles,
  Workflow,
  Activity,
  Layers,
  Settings,
  Bell,
  LogOut,
  ChevronRight,
  Shield,
  Radio,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
  Menu
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/workflows/builder', label: 'AI Builder', icon: Sparkles, badge: 'Agentic' },
  { href: '/executions', label: 'Executions', icon: Activity },
  { href: '/integrations', label: 'Integrations', icon: Layers },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function AppShell({ children, title, subtitle }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, isOpen, toggleDrawer, setDrawerOpen, markAllRead, initUserNotifications } = useNotificationStore();
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      initUserNotifications(user.id);
    }
  }, [user, initUserNotifications]);

  useEffect(() => {
    const s = getSocket();
    if (s) {
      setIsSocketConnected(s.connected);
      const onConnect = () => setIsSocketConnected(true);
      const onDisconnect = () => setIsSocketConnected(false);
      s.on('connect', onConnect);
      s.on('disconnect', onDisconnect);
      return () => {
        s.off('connect', onConnect);
        s.off('disconnect', onDisconnect);
      };
    }
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />;
      case 'failure':
        return <XCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />;
      case 'escalation':
        return <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-sky-400 mt-0.5 flex-shrink-0" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col antialiased">
      {/* Top Navbar */}
      <header className="h-16 border-b border-[#1e2638] bg-[#0c101c]/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 flex items-center justify-between">
        {/* Left: Brand & Breadcrumb */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-surface-100"
          >
            <Menu className="w-5 h-5" />
          </button>

          <a href="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-500 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0d1220] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight flex items-center gap-1.5">
                Agentflow<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">_AI</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Multi-Agent Ops</span>
            </div>
          </a>

          {title && (
            <div className="hidden md:flex items-center space-x-2 text-sm text-slate-400 pl-4 border-l border-[#1e2638]">
              <ChevronRight className="w-4 h-4 text-slate-600" />
              <span className="text-slate-200 font-medium">{title}</span>
            </div>
          )}
        </div>

        {/* Right: Telemetry, Notifications & User */}
        <div className="flex items-center space-x-3">
          {/* Socket.IO Realtime Status Pill */}
          <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[#131a29] border border-[#222d42] text-xs font-mono">
            <Radio className={`w-3.5 h-3.5 ${isSocketConnected ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span className={isSocketConnected ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
              {isSocketConnected ? 'LIVE STREAM' : 'OFFLINE'}
            </span>
          </div>

          {/* Notifications Trigger */}
          <button
            onClick={toggleDrawer}
            className="relative p-2 text-slate-300 hover:text-white rounded-lg hover:bg-surface-100 border border-transparent hover:border-[#222d42] transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-indigo-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center space-x-3 pl-2 border-l border-[#1e2638]">
            <div className="flex flex-col text-right hidden sm:block">
              <span className="text-xs font-medium text-slate-200">{user?.name || 'Operator'}</span>
              <span className="text-[10px] font-mono text-indigo-400 uppercase">{user?.role || 'OPERATOR'}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white shadow">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'O'}
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-60 bg-[#0c101c]/80 border-r border-[#1e2638] flex-col justify-between p-4">
          <div className="space-y-1.5">
            <div className="px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Operations Center
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = router.pathname === item.href || (item.href !== '/dashboard' && router.pathname.startsWith(item.href));
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600/20 to-blue-600/10 text-indigo-300 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-surface-100/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {item.badge}
                    </span>
                  )}
                </a>
              );
            })}
          </div>

          {/* LangGraph & Substrate Status Footer */}
          <div className="p-3 rounded-xl bg-[#111726] border border-[#1e273a] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                LangGraph Substrate
              </span>
              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              5-agent cooperative mesh: Planner, Exec, Validation, Recovery, Monitor.
            </p>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative w-64 bg-[#0c101c] border-r border-[#1e2638] p-4 flex flex-col justify-between z-10">
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-4 border-b border-[#1e2638]">
                  <span className="font-bold text-sm">Navigation</span>
                  <button onClick={() => setMobileMenuOpen(false)}>
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = router.pathname === item.href;
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                        isActive ? 'bg-indigo-600/20 text-indigo-300' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-[#090d16] flex flex-col">
          {children}
        </main>
      </div>

      {/* Notifications Right Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-full max-w-md bg-[#0e1322] border-l border-[#1e273c] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-[#1e273c] flex items-center justify-between bg-[#111728]">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-indigo-400" />
                <h3 className="font-semibold text-sm">Execution Alerts & Timeline</h3>
              </div>
              <div className="flex items-center space-x-2">
                {notifications.length > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
                  >
                    Mark All Read
                  </button>
                )}
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-surface-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <Bell className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm text-slate-400">No notifications yet.</p>
                  <p className="text-xs text-slate-400">Agent execution events will stream here in real time.</p>
                </div>
              ) : (
                notifications.map((notif, idx) => (
                  <div
                    key={notif._id || notif.id || idx}
                    className={`p-3.5 rounded-xl border transition-all ${
                      notif.read
                        ? 'bg-[#111625]/60 border-[#1c2438] text-slate-400'
                        : 'bg-[#141b2e] border-indigo-500/30 text-slate-200 shadow-md'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {getNotificationIcon(notif.type)}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold text-slate-100">{notif.title}</h4>
                          <span className="text-[10px] text-slate-400 font-mono">{formatDate(notif.createdAt)}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{notif.message}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
