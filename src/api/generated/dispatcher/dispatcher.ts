// Stub dispatcher API for mock development.
// Re-export pending mock implementations.

export { useGetDashboard } from '../../pending/dashboard';
export { useGetDispatchQueue } from '../../pending/dispatchQueue';
export const useListAlerts = () => {
  // Simple stub returning empty list
  return { data: [] as any, isLoading: false, isError: false, error: null, refetch: () => {} };
};

export const useRequeueOrder = () => ({
  mutate: () => {},
  isPending: false,
});
