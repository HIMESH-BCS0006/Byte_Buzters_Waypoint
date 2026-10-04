import React, { useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { useListDeferrals, useRequeueOrder } from '../api/generated/dispatcher/dispatcher';
import { useAuth } from '../context/AuthContext';

export const DeferredPage: React.FC = () => {
  const { selectedDepot } = useAuth();
  const { data, isLoading, isError, refetch } = useListDeferrals(
    selectedDepot ? { depot_id: selectedDepot } : undefined
  );

  const requeueMutation = useRequeueOrder();
  const [activeMessage, setActiveMessage] = useState<string | null>(null);

  const handleRequeue = async (orderId: string) => {
    try {
      await requeueMutation.mutateAsync(orderId);
      setActiveMessage(`Order #${orderId} successfully requeued into dispatch queue.`);
      refetch();
    } catch (err: any) {
      setActiveMessage(`Failed to requeue order: ${err.message || 'Unknown error'}`);
    }
  };

  if (isLoading) return <LoadingState />;
  if (isError)
    return (
      <EmptyState
        title="Error loading deferrals"
        description="Could not connect to deferral records."
      />
    );

  const deferrals = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Deferred Orders Queue"
        description={`Audit trail of rolled over, deferred, or skipped customer deliveries (${selectedDepot})`}
      />

      {activeMessage && (
        <div className="p-3 bg-brand-50 border border-brand-200 text-brand-900 rounded-lg text-sm flex justify-between items-center">
          <span>{activeMessage}</span>
          <button
            onClick={() => setActiveMessage(null)}
            className="text-brand-600 font-bold ml-2 hover:text-brand-800"
          >
            ×
          </button>
        </div>
      )}

      {deferrals.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
          <h3 className="text-base font-semibold text-slate-800">No Deferred Orders</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            All submitted customer orders for {selectedDepot} are currently scheduled on active routes.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {deferrals.map((d) => (
            <div
              key={d.id}
              className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {`Order #${d.order_id || d.id}`}
                  </h4>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      d.reason_class === 'UNAVOIDABLE'
                        ? 'bg-slate-100 text-slate-800'
                        : d.reason_class === 'CHOICE'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {d.reason_class || 'OPERATIONAL'}
                  </span>
                </div>

                <p className="text-xs text-slate-700 font-medium mt-2">
                  Code: <span className="font-bold">{d.reason_code}</span> • {d.reason_text}
                </p>

                {d.decided_by && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Decided by: <span className="font-semibold">{d.decided_by}</span>
                  </p>
                )}

                {d.created_at && (
                  <p className="text-[10px] text-slate-400 mt-2 font-mono">
                    Deferred at: {new Date(d.created_at).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold py-2 rounded-lg shadow transition-colors disabled:opacity-50"
                  onClick={() => handleRequeue(d.order_id || d.id)}
                  disabled={requeueMutation.isPending}
                >
                  {requeueMutation.isPending ? 'Requeuing...' : 'Re-queue into Next Plan'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
