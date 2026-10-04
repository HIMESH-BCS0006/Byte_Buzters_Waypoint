import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Store } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('storemanager@waypoint.com');
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
      const token = localStorage.getItem('waypoint_token');

      // Fetch profile or check role to determine target port
      if (token) {
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
          const claims = JSON.parse(atob(payloadBase64));
          const role = claims.role;
          const host = window.location.hostname;
          if (role === 'dispatcher') {
            window.location.href = `http://${host}:3000/?token=${token}`;
            return;
          } else if (role === 'driver') {
            window.location.href = `http://${host}:3002/#/driver?token=${token}`;
            return;
          } else if (role === 'loader') {
            window.location.href = `http://${host}:3002/#/loader?token=${token}`;
            return;
          }
        }
      }

      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(err?.message || 'Login failed. Check your username and password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-8">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-slate-800 bg-slate-950 p-6 sm:p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-brand-950">
            <Store className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">Waypoint Portal</h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">Sign in to your Waypoint account</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-900/50 border border-red-500/50 p-3 text-xs sm:text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-3 rounded-md shadow-sm">
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
                placeholder="storemanager@waypoint.com"
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

        <div className="border-t border-slate-800 pt-4 text-xs text-slate-400 space-y-1">
          <div className="font-semibold text-slate-300 mb-1">Available System Logins:</div>
          <div>• <code className="bg-slate-900 border border-slate-800 px-1 py-0.5 rounded font-mono text-slate-200">driver@waypoint.com</code></div>
          <div>• <code className="bg-slate-900 border border-slate-800 px-1 py-0.5 rounded font-mono text-slate-200">dispatcher@waypoint.com</code></div>
          <div>• <code className="bg-slate-900 border border-slate-800 px-1 py-0.5 rounded font-mono text-slate-200">loader@waypoint.com</code></div>
          <div>• <code className="bg-slate-900 border border-slate-800 px-1 py-0.5 rounded font-mono text-slate-200">storemanager@waypoint.com</code></div>
          <div className="text-[11px] text-slate-500 mt-2">Password for all: <code className="font-mono text-slate-300">pass123</code></div>
        </div>
      </div>
    </div>
  );
};
