import React, { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { LoadingState } from '../components/LoadingState';
import {
  useGetPlanningTrips,
  useGeneratePlan,
  useConfirmTrip,
  useCancelTrip,
  useAddOrderToTrip,
} from '../api/generated/dispatcher/dispatcher';
import { useGetUnplannedOrders } from '../api/pending/unplannedOrders';
import { useAuth } from '../context/AuthContext';

export const PlanningPage: React.FC = () => {
  const { selectedDepot, deliveryDate } = useAuth();

  // Core planning data
  const { data: trips, isLoading, isError, refetch } = useGetPlanningTrips({
    depot_id: selectedDepot,
  });
  const { data: unplannedOrders, isLoading: unplannedLoading } = useGetUnplannedOrders({
    depot_id: selectedDepot,
  });

  const generatePlanMutation = useGeneratePlan();
  const confirmMutation = useConfirmTrip();
  const cancelMutation = useCancelTrip();
  const addOrderMutation = useAddOrderToTrip();

  // UI state
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [activeMessage, setActiveMessage] = useState<string | null>(null);

  const handleGeneratePlan = async () => {
    try {
      setActiveMessage('Generating plan via optimization engine...');
      await generatePlanMutation.mutateAsync({
        depot_id: selectedDepot,
        delivery_date: deliveryDate,
      });
      setActiveMessage('Plan generated successfully!');
      refetch();
    } catch (err: any) {
      setActiveMessage(`Failed to generate plan: ${err.message || 'Unknown error'}`);
    }
  };

  const handleConfirm = async (tripId: string) => {
    try {
      await confirmMutation.mutateAsync(tripId);
      setActiveMessage(`Trip ${tripId} confirmed and queued for loading.`);
      refetch();
    } catch (err: any) {
      setActiveMessage(`Failed to confirm trip: ${err.message || 'Unknown error'}`);
    }
  };

  const handleCancel = async (tripId: string) => {
    try {
      await cancelMutation.mutateAsync(tripId);
      setActiveMessage(`Trip ${tripId} cancelled and orders returned to queue.`);
      refetch();
    } catch (err: any) {
      setActiveMessage(`Failed to cancel trip: ${err.message || 'Unknown error'}`);
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleAddOrdersToTrip = async (tripId: string) => {
    try {
      for (const orderId of selectedOrders) {
        await addOrderMutation.mutateAsync({ tripId, orderId });
      }
      setActiveMessage(`Added ${selectedOrders.length} order(s) to Trip ${tripId}.`);
      setSelectedOrders([]);
      refetch();
    } catch (err: any) {
      setActiveMessage(`Failed to add order to trip: ${err.message || 'Unknown error'}`);
    }
  };

  // Suggest chilled vehicle if there are chilled unplanned orders
  const chilledUnplanned =
    unplannedOrders?.filter((o) => o.temp_requirement === 'chilled') || [];
  const chilledSuggestion =
    chilledUnplanned.length > 0
      ? `Notice: ${chilledUnplanned.length} unassigned chilled order(s) require reefer vehicles.`
      : '';

  if (isLoading) return <LoadingState />;
  if (isError)
    return (
      <EmptyState
        title="Error loading planning data"
        description="Could not connect to planning service."
      />
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Delivery Planning & Optimization"
          description={`Generate and inspect multi-stop routes for ${selectedDepot} (${deliveryDate})`}
        />
        <button
          onClick={handleGeneratePlan}
          disabled={generatePlanMutation.isPending}
          className="inline-flex items-center justify-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg shadow transition-colors disabled:opacity-50"
        >
          {generatePlanMutation.isPending ? 'Optimizing Fleet...' : 'Generate New Plan'}
        </button>
      </div>

      {activeMessage && (
        <div className="p-3 bg-brand-50 border border-brand-200 text-brand-900 rounded-lg text-sm flex justify-between items-center">
          <span>{activeMessage}</span>
          <button
            onClick={() => setActiveMessage(null)}
            className="text-brand-600 font-bold ml-2 hover:text-brand-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Unplanned orders for tomorrow */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Unassigned Orders ({unplannedOrders?.length ?? 0})
          </h2>
          {chilledSuggestion && (
            <span className="text-xs text-blue-700 font-medium bg-blue-50 px-2 py-1 rounded">
              {chilledSuggestion}
            </span>
          )}
        </div>

        {unplannedLoading ? (
          <p className="text-xs text-slate-500">Loading unassigned orders...</p>
        ) : (unplannedOrders ?? []).length === 0 ? (
          <p className="text-xs text-slate-400">All submitted orders are currently assigned to trips.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto pt-1">
            {unplannedOrders?.map((o) => (
              <label
                key={o.id}
                className={`flex items-center p-2.5 border rounded-lg text-xs cursor-pointer transition-colors ${
                  selectedOrders.includes(o.id)
                    ? 'border-brand-500 bg-brand-50/50 text-brand-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-brand-600 mr-2.5"
                  checked={selectedOrders.includes(o.id)}
                  onChange={() => toggleOrderSelection(o.id)}
                />
                <div>
                  <span className="font-semibold">{o.id}</span> – Outlet {o.outlet_id}
                  <div className="text-[10px] text-slate-500">
                    {o.order_units} units ({o.order_weight_kg}kg) • {o.temp_requirement}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </section>

      {/* Trips list */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">
            Generated Route Plans ({(trips ?? []).length} Trips)
          </h2>
        </div>

        {(trips ?? []).length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <h3 className="text-base font-semibold text-slate-800">No Draft Trips Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              There are no active route plans for this depot on {deliveryDate}. Click "Generate New
              Plan" above to run the automated optimization engine.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {(trips ?? []).map((trip) => {
              const weightPct = Math.round(
                (trip.weight_used / Math.max(trip.weight_cap, 1)) * 100
              );
              const volPct = Math.round(
                (trip.volume_used / Math.max(trip.volume_cap, 1)) * 100
              );
              const isConfirmed = trip.status === 'CONFIRMED' || trip.status === 'LOADING';

              return (
                <div
                  key={trip.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-base">{`Trip ${trip.id}`}</h3>
                      <span
                        className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                          isConfirmed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {trip.status || 'DRAFT'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">{`${trip.brand} • ${trip.district}`}</p>

                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                          <span>Payload Weight: {trip.weight_used} / {trip.weight_cap} kg</span>
                          <span className="font-semibold">{weightPct}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${weightPct > 100 ? 'bg-red-500' : 'bg-brand-500'}`}
                            style={{ width: `${Math.min(weightPct, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-slate-600 mb-1">
                          <span>Volume: {trip.volume_used} / {trip.volume_cap} m³</span>
                          <span className="font-semibold">{volPct}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${volPct > 100 ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(volPct, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <span>Duration: {trip.minutes_used}m / {trip.minutes_budget}m max</span>
                        {trip.parking_constraint && (
                          <span className="bg-purple-100 text-purple-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                            Mall Dock
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                    {selectedOrders.length > 0 && !isConfirmed && (
                      <button
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
                        onClick={() => handleAddOrdersToTrip(trip.id)}
                      >
                        Add {selectedOrders.length} Selected Order(s) to this Trip
                      </button>
                    )}

                    {!isConfirmed ? (
                      <div className="flex space-x-2">
                        <button
                          className="flex-1 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold py-2 rounded-lg shadow transition-colors disabled:opacity-50"
                          onClick={() => handleConfirm(trip.id)}
                          disabled={confirmMutation.isPending}
                        >
                          {confirmMutation.isPending ? 'Confirming...' : 'Confirm Trip'}
                        </button>
                        <button
                          className="px-3 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 text-xs font-semibold py-2 rounded-lg transition-colors"
                          onClick={() => handleCancel(trip.id)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg">
                        Trip Confirmed & Sent to Loading Bay
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
