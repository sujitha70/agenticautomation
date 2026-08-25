import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuthStore } from '../store/authStore';
import { Sparkles, Lock, Mail, ArrowRight, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading, error: authError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    const res = await login(email, password);
    setIsSubmitting(false);

    if (res.success) {
      router.push('/dashboard');
    } else {
      setLocalError(res.error || 'Invalid credentials');
    }
  };

  const handleDemoOperator = () => {
    setEmail('operator@agentflow.io');
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col justify-center items-center px-4 relative overflow-hidden">
      <Head>
        <title>Operator Login | Agentflow_AI</title>
      </Head>

      {/* Background ambient glow */}
      <div className="absolute w-[600px] h-[350px] bg-gradient-to-r from-blue-600/15 via-indigo-600/15 to-purple-600/15 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 mx-auto shadow-xl shadow-indigo-500/30">
            <div className="w-full h-full bg-[#0b0f1a] rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Operator Authentication
          </h2>
          <p className="text-xs text-slate-400">
            Access the Agentflow_AI Multi-Agent Operations Console
          </p>
        </div>

        {/* Login Card */}
        <div className="p-6 rounded-2xl bg-[#0c101c]/90 border border-[#1e273c] backdrop-blur-xl shadow-2xl space-y-5">
          {(localError || authError) && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
              <span>{localError || authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Operator Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@agentflow.io"
                  required
                  className="w-full bg-[#131929] border border-[#222d42] rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#131929] border border-[#222d42] rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 font-semibold text-xs text-white shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Pre-fill */}
          <div className="pt-2 border-t border-[#1e273c] text-center">
            <button
              type="button"
              onClick={handleDemoOperator}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-mono"
            >
              Prefill Demo Operator Credentials
            </button>
          </div>
        </div>

        {/* Register link */}
        <p className="text-center text-xs text-slate-400">
          Need a new operator account?{' '}
          <a href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Register here
          </a>
        </p>
      </div>
    </div>
  );
}
