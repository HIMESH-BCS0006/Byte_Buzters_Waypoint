import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin } from '../api/generated/auth/auth';
import { useAuth } from '../context/AuthContext';
import { ErrorState } from '../components/ErrorState';
import { ApiError } from '../api/http';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('dispatcher@waypoint.com');
  const [password, setPassword] = useState('pass123');
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login: authLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await apiLogin({ username, password });

      authLogin(res.access_token, {
        id: res.user_id,
        username: res.username,
        role: res.role,
        display_name: res.display_name,
        depot_ids: res.depot_ids,
        outlet_id: res.outlet_id,
        vehicle_id: res.vehicle_id,
      });

      const role = res.role;
      const token = res.access_token;

      const host = window.location.hostname;
      if (role === 'store_manager') {
        window.location.href = `http://${host}:3001/?token=${token}`;
      } else if (role === 'driver') {
        window.location.href = `http://${host}:3002/#/driver?token=${token}`;
      } else if (role === 'loader') {
        window.location.href = `http://${host}:3002/#/loader?token=${token}`;
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-8">
        <div className="text-center mb-8">
          <div className="inline-block bg-brand-600 text-white font-bold text-xl px-4 py-1.5 rounded-md shadow mb-2">
            WAYPOINT
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900">
            Dispatcher Portal
          </h1>

          <p className="text-xs text-slate-500 mt-1">
            Sign in with your dispatching credentials
          </p>
        </div>

        {error && <ErrorState error={error} />}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Username / Email
            </label>

            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-xs focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
              placeholder="dispatcher@waypoint.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>

            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-xs focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm py-2.5 px-4 rounded-md shadow transition-colors disabled:opacity-50"
          >
            {isSubmitting
              ? 'Signing in...'
              : 'Sign In to Dispatcher Console'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 text-slate-500 text-xs space-y-1">
          <div className="font-semibold text-slate-700 mb-1">Available System Logins:</div>
          <div>• <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">dispatcher@waypoint.com</code></div>
          <div>• <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">driver@waypoint.com</code></div>
          <div>• <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">loader@waypoint.com</code></div>
          <div>• <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">storemanager@waypoint.com</code></div>
          <div className="text-[11px] text-slate-400 mt-2">Password for all: <code className="font-mono text-slate-600">pass123</code></div>
        </div>
      </div>
    </div>
  );
};