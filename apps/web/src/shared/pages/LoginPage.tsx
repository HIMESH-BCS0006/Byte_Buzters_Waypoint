import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Store, UserCheck, Sparkles, Building2, MapPin } from 'lucide-react';

interface PresetStore {
  outletId: string;
  name: string;
  brand: 'Fresh' | 'Style' | 'Tech';
  district: string;
  depot: string;
  username: string;
}

const PRESET_STORES: PresetStore[] = [
  // Fresh Outlets
  {
    outletId: 'OUT001',
    name: 'Fresh Colombo 01',
    brand: 'Fresh',
    district: 'Colombo',
    depot: 'Peliyagoda',
    username: 'store_OUT001@waypoint.test',
  },
  {
    outletId: 'OUT004',
    name: 'Fresh Colombo 02',
    brand: 'Fresh',
    district: 'Colombo',
    depot: 'Peliyagoda',
    username: 'store@waypoint.test',
  },
  {
    outletId: 'OUT025',
    name: 'Fresh Gampaha 01',
    brand: 'Fresh',
    district: 'Gampaha',
    depot: 'Peliyagoda',
    username: 'store_OUT025@waypoint.test',
  },
  {
    outletId: 'OUT061',
    name: 'Fresh Kandy 01',
    brand: 'Fresh',
    district: 'Kandy',
    depot: 'Kandy',
    username: 'store_OUT061@waypoint.test',
  },

  // Style Outlets
  {
    outletId: 'OUT015',
    name: 'Style Colombo 01',
    brand: 'Style',
    district: 'Colombo',
    depot: 'Peliyagoda',
    username: 'store_OUT015@waypoint.test',
  },
  {
    outletId: 'OUT016',
    name: 'Style Colombo 02',
    brand: 'Style',
    district: 'Colombo',
    depot: 'Peliyagoda',
    username: 'store_OUT016@waypoint.test',
  },
  {
    outletId: 'OUT019',
    name: 'Style Colombo 05',
    brand: 'Style',
    district: 'Colombo',
    depot: 'Peliyagoda',
    username: 'store_OUT019@waypoint.test',
  },
  {
    outletId: 'OUT035',
    name: 'Style Gampaha 01',
    brand: 'Style',
    district: 'Gampaha',
    depot: 'Peliyagoda',
    username: 'store_OUT035@waypoint.test',
  },
  {
    outletId: 'OUT075',
    name: 'Style Kandy 01',
    brand: 'Style',
    district: 'Kandy',
    depot: 'Kandy',
    username: 'store_OUT075@waypoint.test',
  },

  // Tech Outlets
  {
    outletId: 'OUT021',
    name: 'Tech Colombo 01',
    brand: 'Tech',
    district: 'Colombo',
    depot: 'Peliyagoda',
    username: 'store_OUT021@waypoint.test',
  },
  {
    outletId: 'OUT022',
    name: 'Tech Colombo 02',
    brand: 'Tech',
    district: 'Colombo',
    depot: 'Peliyagoda',
    username: 'store_OUT022@waypoint.test',
  },
  {
    outletId: 'OUT038',
    name: 'Tech Gampaha 01',
    brand: 'Tech',
    district: 'Gampaha',
    depot: 'Peliyagoda',
    username: 'store_OUT038@waypoint.test',
  },
  {
    outletId: 'OUT081',
    name: 'Tech Kandy 01',
    brand: 'Tech',
    district: 'Kandy',
    depot: 'Kandy',
    username: 'store_OUT081@waypoint.test',
  },
];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('store@waypoint.test');
  const [password, setPassword] = useState('pass123');
  const [selectedBrand, setSelectedBrand] = useState<'Fresh' | 'Style' | 'Tech'>('Fresh');
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

  const handleQuickLogin = async (presetUser: string) => {
    setUsername(presetUser);
    setPassword('pass123');
    setError(null);
    setIsSubmitting(true);
    try {
      await login(presetUser, 'pass123');
      navigate(destination, { replace: true });
    } catch (err: any) {
      setError(err?.message || `Login failed for ${presetUser}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPresets = PRESET_STORES.filter((p) => p.brand === selectedBrand);

  const brandColor = {
    Fresh: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30',
    Style: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30',
    Tech: 'bg-sky-500/20 text-sky-300 border-sky-500/30 hover:bg-sky-500/30',
  };

  const brandTabActive = {
    Fresh: 'border-emerald-500 text-emerald-400 bg-emerald-950/40',
    Style: 'border-indigo-500 text-indigo-400 bg-indigo-950/40',
    Tech: 'border-sky-500 text-sky-400 bg-sky-950/40',
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-8">
      <div className="w-full max-w-lg space-y-6 rounded-2xl border border-slate-800 bg-slate-950 p-6 sm:p-8 shadow-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-brand-950">
            <Store className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">Waypoint Portal</h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">Store Manager Sign In & Multi-Brand Portal</p>
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
                placeholder="e.g. store_OUT001@waypoint.test"
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

        {/* Demo Preset Store Manager Picker */}
        <div className="border-t border-slate-800 pt-5">
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Demo Store Presets (1-Click Login)
            </span>
          </div>

          {/* Brand Tabs */}
          <div className="flex rounded-lg bg-slate-900 p-1 mb-3 border border-slate-800">
            {(['Fresh', 'Style', 'Tech'] as const).map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() => setSelectedBrand(brand)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all border ${
                  selectedBrand === brand
                    ? brandTabActive[brand]
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {brand}
              </button>
            ))}
          </div>

          {/* Presets Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredPresets.map((store) => (
              <button
                key={store.outletId}
                type="button"
                onClick={() => handleQuickLogin(store.username)}
                disabled={isSubmitting}
                className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${brandColor[store.brand]}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-xs text-white">{store.name}</span>
                  <span className="text-[10px] font-mono opacity-80">{store.outletId}</span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-[11px] opacity-75">
                  <MapPin className="h-3 w-3" />
                  <span>{store.district} • {store.depot}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
