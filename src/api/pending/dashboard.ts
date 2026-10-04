// PENDING CONTRACT: GET /dashboard – replace with generated hook when endpoint is added
import { useQuery } from '@tanstack/react-query';

type DashboardSummary = {
  cutoff: { minutes_remaining: number; passed: boolean };
  orders: {
    total: number;
    unassigned: number;
    by_brand: Record<string, number>;
  };
  planning_progress: { planned: number; total: number };
  vehicles: { total: number; available: number; active: number; loading: number; allocated: number };
  active_trips: Array<{ trip: { id: string }; stops_completed?: number; stops_total?: number }>;
};

const mockDashboard: DashboardSummary = {
  cutoff: { minutes_remaining: 12, passed: false },
  orders: { total: 25, unassigned: 5, by_brand: { Fresh: 12, Style: 8, Tech: 5 } },
  planning_progress: { planned: 3, total: 5 },
  vehicles: { total: 40, available: 20, active: 12, loading: 5, allocated: 3 },
  active_trips: [
    { trip: { id: 'TRIP-001' }, stops_completed: 2, stops_total: 5 },
    { trip: { id: 'TRIP-002' }, stops_completed: 4, stops_total: 4 },
  ],
};

export function useGetDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 150));
      return mockDashboard;
    },
  });
}
