// Planning page with loader, driver selection and unplanned orders (tomorrow)
import React, { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { useGetPlanningTrips } from '../api/pending/planning';
import { useConfirmTrip } from '../api/pending/confirmTrip';
import { sendNotification } from '../utils/notification';
import { useGetLoaders } from '../api/pending/loaders';
import { useGetDrivers } from '../api/pending/drivers';
import { useGetUnplannedOrders } from '../api/pending/unplannedOrders';

export const PlanningPage: React.FC = () => {
  // Core planning data
  const { data: trips, isLoading, isError } = useGetPlanningTrips();
  const confirmMutation = useConfirmTrip();

  // Mock selections
  const { data: loaders } = useGetLoaders();
  const { data: drivers } = useGetDrivers();
  const { data: unplannedOrders, isLoading: unplannedLoading } = useGetUnplannedOrders();

  // UI state
  const [selectedLoader, setSelectedLoader] = useState<string>('');
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const handleConfirm = async (tripId: string) => {
    await confirmMutation.mutateAsync(tripId);
    sendNotification(
      ['loader@example.com', 'driver@example.com', 'store@example.com'],
      `Trip ${tripId} confirmed – please proceed.`
    );
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleAddOrdersToTrip = (tripId: string) => {
    // In a real implementation this would call an API to attach the orders.
    console.log('Adding orders', selectedOrders, 'to trip', tripId);
    setSelectedOrders([]);
  };

  // Suggest chilled vehicle if there are chilled unplanned orders
  const chilledUnplanned = unplannedOrders?.filter((o) => o.temperature === 'Cold') || [];
  const chilledSuggestion = chilledUnplanned.length > 0 ? 'Consider adding chilled orders to chilled vehicles.' : '';

  // Loading / error handling
  if (isLoading) return <EmptyState title="Loading planning…" description="Please wait." />;
  if (isError) return <EmptyState title="Error" description="Could not load planning data." />;
  if (!trips || trips.length === 0) {
    return (
      <EmptyState
        title="No draft trips"
        description="Generate a plan first (POST /plans/generate)."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Planning" description="Trip generation, H1‑H12 constraint validation, and run closure" />
      {/* Loader & Driver selectors */}
      <div className="flex space-x-4 mb-4">
        <select className="border rounded p-2" value={selectedLoader} onChange={(e) => setSelectedLoader(e.target.value)}>
          <option value="">Select Loader</option>
          {loaders?.map((l) => (
            <option key={l.id} value={l.id}> {l.name} </option>
          ))}
        </select>
        <select className="border rounded p-2" value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)}>
          <option value="">Select Driver</option>
          {drivers?.map((d) => (
            <option key={d.id} value={d.id}> {d.name} </option>
          ))}
        </select>
      </div>

      {/* Unplanned orders for tomorrow */}
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Unplanned Orders (Tomorrow)</h2>
        {unplannedLoading ? (
          <p>Loading unplanned orders…</p>
        ) : (
          <ul className="list-disc pl-5">
            {unplannedOrders?.map((o) => (
              <li key={o.id} className="flex items-center">
                <input type="checkbox" className="mr-2" checked={selectedOrders.includes(o.id)} onChange={() => toggleOrderSelection(o.id)} />
                {o.id} – {o.outlet_id} – {o.delivery_date}
              </li>
            ))}
          </ul>
        )}
        {chilledSuggestion && <p className="text-sm text-blue-600 mt-2">{chilledSuggestion}</p>}
      </section>

      {/* Trips list */}
      <div className="grid gap-4 md:grid-cols-2">
        {trips.map((trip) => (
          <div key={trip.id} className="p-4 bg-white border rounded shadow-sm">
            <h3 className="font-semibold text-lg">{`Trip ${trip.id}`}</h3>
            <p className="text-sm text-gray-600">{`${trip.brand} – ${trip.district}`}</p>
            <p className="text-xs mt-2">Vehicle: {trip.vehicle.type} ({trip.vehicle.temperature})</p>
            <p className="text-xs">Weight {trip.weight_used}/{trip.weight_cap} kg, Volume {trip.volume_used}/{trip.volume_cap} m³</p>
            <p className="text-xs">
              Time {trip.minutes_used}/{trip.minutes_budget} min
              {trip.parking_constraint && (
                <span className="ml-2 bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded">Mall dock</span>
              )}
            </p>
            {selectedOrders.length > 0 && (
              <button className="mt-2 w-full bg-green-600 text-white py-1 rounded hover:bg-green-700" onClick={() => handleAddOrdersToTrip(trip.id)}>
                Add Selected Orders to Trip
              </button>
            )}
            <button className="mt-3 w-full bg-brand-700 text-white py-1 rounded hover:bg-brand-800" onClick={() => handleConfirm(trip.id)} disabled={confirmMutation.isLoading}>
              {confirmMutation.isLoading ? 'Confirming…' : 'Confirm Trip'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
