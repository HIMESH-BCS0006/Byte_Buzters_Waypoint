import { useQuery } from '@tanstack/react-query';
import { customInstance } from '../http';
import type { PlanRun } from '../generated/models/planRun';
import type { TripDetail } from '../generated/models/tripDetail';

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
  parking_constraint?: string;
  status?: string;
};

export function useGetPlanningTrips(params?: { depot_id?: string; plan_run_id?: string }) {
  return useQuery({
    queryKey: ['planningTrips', params?.depot_id, params?.plan_run_id],
    queryFn: async ({ signal }) => {
      let planRunId = params?.plan_run_id;

      // If no plan_run_id is provided, get the latest plan run for this depot
      if (!planRunId) {
        const plans = await customInstance<PlanRun[]>({
          url: '/plans',
          method: 'GET',
          params: params?.depot_id ? { depot_id: params.depot_id } : undefined,
          signal,
        });

        if (plans && plans.length > 0) {
          planRunId = plans[0].id;
        }
      }

      if (!planRunId) {
        return [];
      }

      const tripDetails = await customInstance<TripDetail[]>({
        url: `/plans/${planRunId}/trips`,
        method: 'GET',
        params: params?.depot_id ? { depot_id: params.depot_id } : undefined,
        signal,
      });

      return (tripDetails || []).map((td) => {
        const t = td.trip;
        const hasMallDock = (td.stops || []).some(
          (s) => s.parking_constraint === 'mall_dock'
        );
        return {
          id: t.id,
          brand: t.brand,
          district: t.district,
          vehicle: {
            type: t.vehicle_type,
            temperature: t.temperature,
          },
          weight_used: t.weight_used_kg || 0,
          weight_cap: t.weight_cap_kg || 0,
          volume_used: t.volume_used_m3 || 0,
          volume_cap: t.volume_cap_m3 || 0,
          minutes_used: t.minutes_used || 0,
          minutes_budget: t.minutes_budget || 0,
          parking_constraint: hasMallDock ? 'mall_dock' : undefined,
          status: t.status,
        } as TripCard;
      });
    },
  });
}
