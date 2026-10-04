// src/api/pending/deferrals.ts
/* PENDING CONTRACT: GET /deferrals – replace with generated hook when endpoint is added */
import { useQuery } from '@tanstack/react-query';

export type Deferral = {
  id: string;
  reason_code: string;
  reason_class: 'UNAVOIDABLE' | 'CHOICE' | 'OPERATIONAL' | 'DISPATCHER';
  reason_text: string;
  consequence_text: string;
  history_count: number;
  notified_at: string;
  resolved_to_date?: string;
};

const mockDeferrals: Deferral[] = [
  {
    id: 'DEF-001',
    reason_code: 'R001',
    reason_class: 'UNAVOIDABLE',
    reason_text: 'Road closure',
    consequence_text: 'Orders will be delayed',
    history_count: 2,
    notified_at: '2025-08-01T09:15:00+05:30',
    resolved_to_date: undefined,
  },
  {
    id: 'DEF-002',
    reason_code: 'R002',
    reason_class: 'CHOICE',
    reason_text: 'Customer request',
    consequence_text: 'Re‑schedule delivery',
    history_count: 1,
    notified_at: '2025-08-01T10:30:00+05:30',
    resolved_to_date: undefined,
  },
];

export function useGetDeferrals() {
  return useQuery({
    queryKey: ['deferrals'],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 150));
      return mockDeferrals;
    },
  });
}