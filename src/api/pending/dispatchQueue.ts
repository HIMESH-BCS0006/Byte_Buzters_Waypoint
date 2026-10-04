// PENDING CONTRACT: GET /dispatch/queue – replace with generated hook when endpoint is added
import { useQuery } from '@tanstack/react-query';

type Order = {
  id: string;
  outlet_id: string;
  delivery_date: string;
  status: string;
  brand?: string;
  district?: string;
  temperature?: string;
  deferred_yesterday?: boolean;
  days_since_last_served?: number;
};

export const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    outlet_id: 'OUT001',
    delivery_date: '2025-08-01',
    status: 'SUBMITTED',
    brand: 'Fresh',
    district: 'North',
    temperature: 'Cold',
    deferred_yesterday: false,
    days_since_last_served: 3,
  },
  {
    id: 'ORD-002',
    outlet_id: 'OUT002',
    delivery_date: '2025-08-01',
    status: 'DEFERRED',
    brand: 'Style',
    district: 'South',
    temperature: 'Ambient',
    deferred_yesterday: true,
    days_since_last_served: 1,
  },
  {
    id: 'ORD-003',
    outlet_id: 'OUT001',
    delivery_date: '2026-10-02',
    status: 'SUBMITTED',
    brand: 'Fresh',
    district: 'North',
    temperature: 'Cold',
    deferred_yesterday: false,
    days_since_last_served: 4,
  },
  {
    id: 'ORD-004',
    outlet_id: 'OUT002',
    delivery_date: '2026-10-03',
    status: 'SUBMITTED',
    brand: 'Style',
    district: 'South',
    temperature: 'Ambient',
    deferred_yesterday: false,
    days_since_last_served: 0,
  },
  {
    id: 'ORD-005',
    outlet_id: 'OUT001',
    delivery_date: '2026-10-04',
    status: 'DEFERRED',
    brand: 'Fresh',
    district: 'North',
    temperature: 'Cold',
    deferred_yesterday: true,
    days_since_last_served: 1,
  },
];

export function useGetDispatchQueue() {
  return useQuery({
    queryKey: ['dispatchQueue'],
    queryFn: () => mockOrders,
    initialData: mockOrders,
  });
}
