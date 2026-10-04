// src/api/pending/confirmTrip.ts
/* PENDING CONTRACT: POST /trips/{id}/confirm – replace with generated mutation when endpoint is added */
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useConfirmTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tripId: string) => {
      // pretend the server accepted the confirmation
      await new Promise(r => setTimeout(r, 100));
      return { success: true, tripId };
    },
    onSuccess: (_, tripId) => {
      // Invalidate any cached planning data so UI refreshes
      queryClient.invalidateQueries({ queryKey: ['planningTrips'] });
    },
  });
}