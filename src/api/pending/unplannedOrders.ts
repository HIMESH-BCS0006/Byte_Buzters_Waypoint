// Mock unplanned orders for tomorrow (delivery_date = tomorrow)
import { useQuery } from '@tanstack/react-query';
import { mockOrders } from './dispatchQueue'; // reuse existing mockOrders

// Helper to get tomorrow's date string in YYYY-MM-DD
function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

export const useGetUnplannedOrders = () => {
  return useQuery({
    queryKey: ['unplannedOrders'],
    queryFn: () => mockOrders.filter((o) => o.delivery_date === getTomorrow()),
    // No initialData needed; will be empty until fetched
  });
};
