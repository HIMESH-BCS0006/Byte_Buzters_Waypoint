import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Store, Key, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('store@waypoint.test');
  const [password, setPassword] = useState('pass123');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const from = (location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null)?.from;
  const destination = from?.pathname
    ? `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`
    : '/store';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(username, password);
      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Login failed. Check your username and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDevLogin = async (role: 'store_manager') => {
    try {
      await login('store@waypoint.test', 'pass123');
      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Store Manager login failed.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-950 p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-brand-950">
            <Store className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-white">Waypoint Portal</h2>
          <p className="mt-1 text-sm text-slate-400">Sign in to access your role dashboard</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-900/50 border border-red-500/50 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Username / Email
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="store@waypoint.test"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-bold text-brand-950 hover:bg-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="border-t border-slate-800 pt-6">
          <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Quick Dev Login
          </p>
          <button
            onClick={() => handleDevLogin('store_manager')}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-brand-300 hover:bg-slate-800 transition-colors"
          >
            <UserCheck className="h-4 w-4" />
            Sign in as Store Manager (Fresh OUT004)
          </button>
        </div>
      </div>
    </div>
  );
};
