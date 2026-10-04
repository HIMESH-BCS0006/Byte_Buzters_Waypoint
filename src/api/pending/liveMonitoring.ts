// src/api/pending/liveMonitoring.ts
/* PENDING CONTRACT: GET /monitoring/live – replace with generated hook when endpoint is added */
import { useQuery } from '@tanstack/react-query';

export type VehicleStatus = {
  id: string;
  brand: string;
  district: string;
  progress: string; // e.g. "2/5"
  delay_min: number;
  health: 'on_schedule' | 'delayed' | 'blocked';
  next_stop?: string;
  eta?: string;
};

const mockVehicles: VehicleStatus[] = [
  {
    id: 'VEH001',
    brand: 'Fresh',
    district: 'North',
    progress: '2/5',
    delay_min: 0,
    health: 'on_schedule',
    next_stop: 'Outlet A',
    eta: '10m',
  },
  {
    id: 'VEH002',
    brand: 'Style',
    district: 'South',
    progress: '5/5',
    delay_min: 12,
    health: 'delayed',
    next_stop: 'Outlet Z',
    eta: '20m',
  },
];

export function useGetLiveMonitoring() {
  return useQuery({
    queryKey: ['liveMonitoring'],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 150));
      return mockVehicles;
    },
  });
}   