/**
 * Pending contract placeholder for GET /plans/{plan_run_id}/trips
 * This file provides a typed fixture to simulate the missing endpoint until the backend adds it.
 * Once the OpenAPI spec includes the endpoint, replace the exported hook with the generated one
 * from Orval (e.g., `useGetPlanTrips`).
 */

import { useQuery } from '@tanstack/react-query';
import type { TripDetail } from '../generated/models/tripDetail';
import type { TripCard } from '../generated/models/tripCard';
import type { StopDetail } from '../generated/models/stopDetail';

// ---- Typed fixture data ----------------------------------------------------

const fixtureTripDetails: TripDetail[] = [
  {
    trip: {
      id: 'TRIP-001',
      plan_run_id: 'PLANRUN-001',
      brand: 'Fresh',
      district: 'Colombo',
      vehicle_id: 'VEH001',
      vehicle_type: 'truck',
      temperature: 'chilled',
      weight_cap_kg: 4000,
      weight_used_kg: 1200,
      volume_cap_m3: 30,
      volume_used_m3: 5,
      minutes_used: 95,
      minutes_budget: 270,
      fuel_litres_used: 45,
      status: 'DRAFT',
    },
    stops: [
      {
        stop_number: 1,
        order_id: 'ORD-001',
        outlet_id: 'OUT001',
        eta: '04:15',
        window_open_time: '03:30',
        window_close_time: '07:30',
        parking_constraint: 'van_only',
      },
      {
        stop_number: 2,
        order_id: 'ORD-002',
        outlet_id: 'OUT015', // mall outlet
        eta: '05:00',
        window_open_time: '09:00',
        window_close_time: '11:00',
        parking_constraint: 'mall_dock',
      },
    ],
  },
  {
    trip: {
      id: 'TRIP-002',
      plan_run_id: 'PLANRUN-001',
      brand: 'Style',
      district: 'Kandy',
      vehicle_id: 'VEH044',
      vehicle_type: 'van',
      temperature: 'ambient',
      weight_cap_kg: 1200,
      weight_used_kg: 900,
      volume_cap_m3: 12,
      volume_used_m3: 8,
      minutes_used: 210,
      minutes_budget: 480,
      fuel_litres_used: 30,
      status: 'CONFIRMED',
    },
    stops: [
      {
        stop_number: 1,
        order_id: 'ORD-010',
        outlet_id: 'OUT020',
        eta: '10:15',
        window_open_time: '09:00',
        window_close_time: '17:00',
        parking_constraint: 'street',
      },
    ],
  },
];

/**
 * Hook that mimics the missing `GET /plans/{plan_run_id}/trips` endpoint.
 * It returns the fixture data wrapped in React Query so the UI can use the same
 * pattern as other generated hooks.
 *
 * When the contract is added, replace the implementation with:
 *   export const useGetPlanTrips = generatedHook;
 */
export function useGetPlanTrips(planRunId: string) {
  // The `planRunId` argument is kept to match the real endpoint signature.
  // The fixture ignores it – it always returns the same static data.
  return useQuery<TripDetail[], Error>(
    ['planTrips', planRunId],
    async () => {
      // In a real call we would fetch from the server.
      // Here we simply resolve the static fixture.
      return fixtureTripDetails;
    },
    {
      // No retry – fixture is always stable.
      retry: false,
      // Keep data fresh for the page session.
      staleTime: Infinity,
    }
  );
}
