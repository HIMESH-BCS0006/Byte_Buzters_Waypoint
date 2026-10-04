// src/api/pending/planning.ts
/* PENDING CONTRACT: GET /plans/{plan_run_id}/trips – replace with generated hook when endpoint is added */
import { useQuery } from '@tanstack/react-query';

export type TripCard = {
  id: string;
  brand: string;
  district: string;
  vehicle: { type: string; temperature: string };
  weight_used: number;
  weight_cap: number;
  volume_used: number;
  volume_cap: number;
  minutes_used: number;
  minutes_budget: number;
  parking_constraint?: 'mall_dock';
};

const mockTrips: TripCard[] = [
  {
    id: 'TRIP-001',
    brand: 'Fresh',
    district: 'North',
    vehicle: { type: 'Reefer', temperature: 'Cold' },
    weight_used: 1500,
    weight_cap: 2000,
    volume_used: 8,
    volume_cap: 10,
    minutes_used: 120,
    minutes_budget: 270,
    parking_constraint: undefined,
  },
  {
    id: 'TRIP-002',
    brand: 'Style',
    district: 'South',
    vehicle: { type: 'Dry', temperature: 'Ambient' },
    weight_used: 1800,
    weight_cap: 2500,
    volume_used: 12,
    volume_cap: 15,
    minutes_used: 320,
    minutes_budget: 480,
    parking_constraint: 'mall_dock',
  },
];

export function useGetPlanningTrips() {
  return useQuery({
    queryKey: ['planningTrips'],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 200));
      return mockTrips;
    },
  });
}
