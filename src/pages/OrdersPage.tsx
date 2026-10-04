import React, { useMemo, useState } from 'react';
import { useGetDispatchQueue } from '../api/generated/dispatcher/dispatcher';
import { useOutletMap } from '../hooks/useOutletMap';
import { useAuth } from '../context/AuthContext';
import type { Order } from '../api/generated/models';
import { OrderStatus, TemperatureRequirement, Brand } from '../api/generated/models';
import { PageHeader } from '../components/PageHeader';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { StatusBadge } from '../components/StatusBadge';
import { OrderDetailPanel } from '../components/OrderDetailPanel';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Filters {
  brand: string;
  depot: string;
  delivery_date: string;
  status: string;
  temp_requirement: string;
}

// Priority flags are NOT in the current openapi.yaml; backend has been asked to add them.
// We cast to this extended type to safely access them when present.
type OrderWithPriorityFlags = Order & {
  deferred_yesterday?: boolean;
  days_since_last_served?: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ALL = '';

const STATUSES: string[] = [
  OrderStatus.SUBMITTED,
  OrderStatus.PLANNED,
  OrderStatus.SCHEDULED,
  OrderStatus.LOADED,
  OrderStatus.IN_TRANSIT,
  OrderStatus.DELIVERED,
  OrderStatus.PARTIALLY_DELIVERED,
  OrderStatus.DEFERRED,
  OrderStatus.CANCELLED,
];

const BRANDS: string[] = [Brand.Fresh, Brand.Style, Brand.Tech];
const TEMPS: string[] = [TemperatureRequirement.ambient, TemperatureRequirement.chilled];

function FilterSelect({
  label,
  value,
  options,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-slate-300 rounded-md text-xs px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
      >
        <option value={ALL}>{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export const OrdersPage: React.FC = () => {
  const { selectedDepot, deliveryDate } = useAuth();

  const [filters, setFilters] = useState<Filters>({
    brand: ALL,
    depot: ALL,
    delivery_date: deliveryDate,
    status: ALL,
    temp_requirement: ALL,
  });

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const {
    data: orders,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetDispatchQueue();

  const { outletsById, isLoading: loadingOutlets } = useOutletMap();

  // Collect unique depots across loaded outlets
  const depotOptions = useMemo(() => {
    const depots = new Set<string>();
    Object.values(outletsById).forEach((o) => o.depot && depots.add(o.depot));
    return Array.from(depots).sort();
  }, [outletsById]);

  // Apply all filters client-side (dispatch/queue has no server-side brand/district filter)
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return (orders as OrderWithPriorityFlags[]).filter((order) => {
      const outlet = outletsById[order.outlet_id];

      if (filters.brand !== ALL && outlet?.brand !== filters.brand) return false;
      if (filters.depot !== ALL && outlet?.depot !== filters.depot) return false;
      if (filters.delivery_date && order.delivery_date !== filters.delivery_date) return false;
      if (filters.status !== ALL && order.status !== filters.status) return false;
      if (
        filters.temp_requirement !== ALL &&
        order.temp_requirement !== filters.temp_requirement
      )
        return false;

      return true;
    });
  }, [orders, outletsById, filters]);

  // Determine if any priority-flag columns are present in the actual data
  const hasDeferredYesterdayFlag = useMemo(
    () => (orders as OrderWithPriorityFlags[] | undefined)?.some((o) => 'deferred_yesterday' in o) ?? false,
    [orders]
  );
  const hasDaysSinceFlag = useMemo(
    () =>
      (orders as OrderWithPriorityFlags[] | undefined)?.some(
        (o) => 'days_since_last_served' in o
      ) ?? false,
    [orders]
  );

  const selectedOrder = orders?.find((o) => o.id === selectedOrderId) as
    | OrderWithPriorityFlags
    | undefined;
  const selectedOutlet = selectedOrder ? outletsById[selectedOrder.outlet_id] : undefined;

  const setFilter = (key: keyof Filters) => (value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const isFilterActive = Object.values(filters).some((v) => v !== ALL);
  const isFiltered = isFilterActive;

  return (
    <div className="h-full flex flex-col gap-4">
      <PageHeader
        title="Orders"
        description="Dispatch queue — filterable by brand, depot, date, status, and temperature"
      />

      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-lg px-5 py-3 flex flex-wrap gap-4 items-end shadow-sm">
        <FilterSelect
          label="Brand"
          value={filters.brand}
          options={BRANDS}
          placeholder="All brands"
          onChange={setFilter('brand')}
        />
        <FilterSelect
          label="Depot"
          value={filters.depot}
          options={depotOptions}
          placeholder="All depots"
          onChange={setFilter('depot')}
        />
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Delivery Date
          </label>
          <input
            type="date"
            value={filters.delivery_date}
            onChange={(e) => setFilter('delivery_date')(e.target.value)}
            className="border border-slate-300 rounded-md text-xs px-2.5 py-1.5 bg-white focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <FilterSelect
          label="Status"
          value={filters.status}
          options={STATUSES}
          placeholder="All statuses"
          onChange={setFilter('status')}
        />
        <FilterSelect
          label="Temperature"
          value={filters.temp_requirement}
          options={TEMPS}
          placeholder="All temps"
          onChange={setFilter('temp_requirement')}
        />
        {isFiltered && (
          <button
            onClick={() =>
              setFilters({
                brand: ALL,
                depot: ALL,
                delivery_date: deliveryDate,
                status: ALL,
                temp_requirement: ALL,
              })
            }
            className="self-end text-xs text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-300 rounded-md px-2.5 py-1.5 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Content area */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Table side */}
        <div
          className={`flex flex-col bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden transition-all ${
            selectedOrderId ? 'w-3/5' : 'w-full'
          }`}
        >
          {(isLoading || loadingOutlets) && <LoadingState message="Loading orders…" />}

          {isError && (
            <div className="p-4">
              <ErrorState error={error} onRetry={() => refetch()} />
            </div>
          )}

          {!isLoading && !isError && (
            <>
              {orders && orders.length === 0 ? (
                <EmptyState
                  title="No orders in queue"
                  description="There are no orders in the dispatch queue for this depot."
                />
              ) : filteredOrders.length === 0 ? (
                <EmptyState
                  title="No orders match the filters"
                  description="Try changing or clearing the filter criteria above."
                  actionLabel="Clear filters"
                  onAction={() =>
                    setFilters({
                      brand: ALL,
                      depot: ALL,
                      delivery_date: deliveryDate,
                      status: ALL,
                      temp_requirement: ALL,
                    })
                  }
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs divide-y divide-slate-100">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-wider">
                          Outlet / Brand / District
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-wider">
                          Depot
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-wider">
                          Delivery Date
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-wider">
                          Temp
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-wider">
                          Units / kg / m³
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 uppercase tracking-wider">
                          Status
                        </th>
                        {/* Priority flag columns — hidden when fields are absent from all rows */}
                        {hasDeferredYesterdayFlag && (
                          <th
                            className="px-4 py-3 text-left font-semibold text-amber-700 uppercase tracking-wider"
                            title="Deferred Yesterday — backend field (not yet in openapi.yaml)"
                          >
                            Def. Yesterday
                          </th>
                        )}
                        {hasDaysSinceFlag && (
                          <th
                            className="px-4 py-3 text-left font-semibold text-amber-700 uppercase tracking-wider"
                            title="Days since last served — backend field (not yet in openapi.yaml)"
                          >
                            Days Since Served
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredOrders.map((order) => {
                        const outlet = outletsById[order.outlet_id];
                        const isSelected = order.id === selectedOrderId;
                        return (
                          <tr
                            key={order.id}
                            onClick={() =>
                              setSelectedOrderId(isSelected ? null : order.id)
                            }
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-brand-50 border-l-4 border-l-brand-500'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="px-4 py-3 font-mono font-semibold text-indigo-700">
                              {order.id}
                            </td>
                            <td className="px-4 py-3">
                              {outlet ? (
                                <div>
                                  <span className="font-semibold text-slate-800">
                                    {outlet.outlet_id}
                                  </span>
                                  <span className="ml-1.5 text-slate-500">
                                    {outlet.brand} · {outlet.district}
                                  </span>
                                </div>
                              ) : (
                                <span className="font-mono text-slate-700">
                                  {order.outlet_id}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-700">
                              {outlet?.depot ?? '–'}
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-700">
                              {order.delivery_date}
                              {order.rolled_over && (
                                <span
                                  className="ml-1 bg-amber-100 text-amber-800 text-[10px] px-1 py-0.5 rounded font-semibold"
                                  title={`Rolled over from ${order.requested_delivery_date ?? '?'}`}
                                >
                                  ↺ rolled
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  order.temp_requirement === 'chilled'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {order.temp_requirement}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-700 font-mono">
                              {order.order_units}u /{' '}
                              {order.order_weight_kg}kg /{' '}
                              {order.order_volume_m3}m³
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={order.status} type="order" />
                              {order.deferral_count > 0 && (
                                <span className="ml-1 bg-red-100 text-red-700 text-[10px] px-1 rounded font-bold">
                                  {order.deferral_count}×
                                </span>
                              )}
                            </td>
                            {/* Priority flag cells — only rendered when column is shown */}
                            {hasDeferredYesterdayFlag && (
                              <td className="px-4 py-3">
                                {order.deferred_yesterday ? (
                                  <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-bold">
                                    YES
                                  </span>
                                ) : (
                                  <span className="text-slate-300">–</span>
                                )}
                              </td>
                            )}
                            {hasDaysSinceFlag && (
                              <td className="px-4 py-3 font-mono text-amber-800 font-semibold">
                                {order.days_since_last_served ?? '–'}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="px-4 py-2 border-t border-slate-100 text-[11px] text-slate-400 bg-slate-50">
                    {filteredOrders.length} of {orders?.length ?? 0} order
                    {(orders?.length ?? 0) !== 1 ? 's' : ''}
                    {isFiltered ? ' (filtered)' : ''}
                    {!hasDeferredYesterdayFlag && !hasDaysSinceFlag && (
                      <span className="ml-3 text-amber-600">
                        ⚠ Priority flags (deferred_yesterday, days_since_last_served) not yet in
                        API response — columns hidden
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail panel */}
        {selectedOrderId && selectedOrder && (
          <div className="w-2/5 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
            <OrderDetailPanel
              order={selectedOrder}
              outlet={selectedOutlet}
              onClose={() => setSelectedOrderId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
