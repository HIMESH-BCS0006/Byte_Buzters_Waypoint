// src/api/pending/loading.ts
/* PENDING CONTRACT: GET /loading – replace with generated hook when endpoint is added */
import { useQuery } from '@tanstack/react-query';

export type LoadingSummary = {
  shortfall: number;
  pendingOrders: number;
  vehiclesLoading: number;
};

const mockLoading: LoadingSummary = {
  shortfall: 3,
  pendingOrders: 12,
  vehiclesLoading: 4,
};

export function useGetLoading() {
  return useQuery({
    queryKey: ['loading'],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 150));
      return mockLoading;
    },
  });
}