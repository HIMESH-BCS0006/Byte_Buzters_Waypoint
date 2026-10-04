import React, { useEffect } from 'react';
import { PageHeader } from '../components/PageHeader';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { useGetDashboard } from '../api/generated/dispatcher/dispatcher';
import { useListAlerts } from '../api/generated/dispatcher/dispatcher';
import { AlertItem } from '../api/generated/models/alertItem';
import { useNavigate } from 'react-router-dom';

/**
 * Dashboard (P1) – dispatcher overview.
 * Shows orders summary, planning progress, vehicle states, active trips, and alerts.
 * Cutoff countdown uses the server‑provided `minutes_remaining` (no browser clock).
 * Refetches on SSE events (TODO) or falls back to 15 s polling.
 */
export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Dashboard summary data (GET /dashboard)
  const dashboardQuery = useGetDashboard();

  // Alerts list (GET /alerts)
  const alertsQuery = useListAlerts();

  if (dashboardQuery.isLoading || alertsQuery.isLoading) return <LoadingState />;
  if (dashboardQuery.isError) return <ErrorState error={dashboardQuery.error as any} />;
  if (alertsQuery.isError) return <ErrorState error={alertsQuery.error as any} />;

  const data = dashboardQuery.data!; // non-null after loading checks
  const alerts = alertsQuery.data ?? [];

  const renderAlert = (alert: AlertItem) => {
    const handleClick = () => {
      switch (alert.type) {
        case 'shortfall':
          navigate('/loading');
          break;
        case 'exception':
        case 'sync_conflict':
          navigate('/monitoring');
          break;
        case 'repeat_deferral':
          navigate('/deferred');
          break;
        default:
          break;
      }
    };
    return (
      <div key={alert.id} className="p-2 border rounded cursor-pointer" onClick={handleClick}>
        <div className="font-medium">{alert.type.replace('_', ' ')}</div>
        <div className="text-sm">{alert.message}</div>
        <div className="text-xs text-gray-500">Severity: {alert.severity}</div>
      </div>
    );
  };

  const cutoffPassed = data.cutoff.passed || data.cutoff.minutes_remaining <= 0;

  return (
    <div className="space-y-4">
      <PageHeader title="Dashboard" description="Dispatcher overview metrics, cutoff countdown, and fleet readiness" />

      {/* Cutoff countdown */}
      <div className="px-3 py-2 bg-white border border-slate-200 rounded flex items-center justify-between">
        <h3 className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Order cutoff</h3>
        {cutoffPassed ? (
          <span className="text-[11px] text-red-600 font-semibold">Cutoff passed</span>
        ) : (
          <span className="text-[11px] text-slate-800 font-semibold">{data.cutoff.minutes_remaining} minute(s) remaining</span>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {/* Orders */}
        <div className="p-3 bg-white border border-slate-200 rounded">
          <h4 className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Total orders</h4>
          <p className="text-2xl font-bold text-slate-900 mt-1">{data.orders.total}</p>
          <p className="text-[10px] text-slate-500">{data.orders.unassigned} awaiting assignment</p>
          <ul className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-600 space-y-0.5">
            {Object.entries(data.orders.by_brand).map(([brand, cnt]) => (
              <li key={brand} className="flex justify-between"><span>{brand}</span><span>{cnt}</span></li>
            ))}
          </ul>
        </div>
        {/* Planning progress */}
        <div className="p-3 bg-white border border-slate-200 rounded">
          <h4 className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Planned</h4>
          <p className="text-2xl font-bold text-brand-700 mt-1">{data.planning_progress.planned}</p>
          <p className="text-[10px] text-slate-500">of {data.planning_progress.total} trips planned</p>
          <div className="h-1.5 bg-slate-100 rounded mt-3 overflow-hidden"><div className="h-full bg-brand-700" style={{ width: `${Math.round((data.planning_progress.planned / Math.max(data.planning_progress.total, 1)) * 100)}%` }} /></div>
        </div>
        {/* Vehicles */}
        <div className="p-3 bg-white border border-slate-200 rounded">
          <h4 className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Vehicles</h4>
          <p className="text-2xl font-bold text-slate-900 mt-1">{data.vehicles.total}</p>
          <div className="grid grid-cols-2 gap-x-3 mt-2 text-[10px] text-slate-600">
            <span>Available <b className="text-slate-900">{data.vehicles.available}</b></span>
            <span>Active <b className="text-brand-700">{data.vehicles.active}</b></span>
            <span>Loading <b className="text-slate-900">{data.vehicles.loading}</b></span>
            <span>Allocated <b className="text-slate-900">{data.vehicles.allocated}</b></span>
          </div>
        </div>
        {/* Active trips */}
        <div className="p-3 bg-white border border-slate-200 rounded">
          <h4 className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Active trips</h4>
          {data.active_trips.map((trip) => (
            <div key={trip.trip.id} className="mt-2 pb-2 border-b border-slate-100 last:border-0">
              <p className="font-semibold text-[11px]">Trip {trip.trip.id}</p>
              <p className="text-[10px] text-slate-500">{trip.stops_completed ?? 0} / {trip.stops_total ?? 0} stops completed</p>
            </div>
          ))}
        </div>
        {/* Alerts */}
        <div className="p-3 bg-white border border-slate-200 rounded xl:col-span-2">
          <h4 className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Alerts</h4>
          {alerts.length === 0 ? (
            <p className="text-gray-500">No alerts</p>
          ) : (
            <div className="space-y-2">{alerts.map(renderAlert)}</div>
          )}
        </div>
      </div>
    </div>
  );
};
