import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { useGetDeferrals } from '../api/pending/deferrals';

export const DeferredPage: React.FC = () => {
  const { data, isLoading, isError } = useGetDeferrals();

  if (isLoading) return <EmptyState title="Loading deferrals…" description="Please wait." />;
  if (isError) return <EmptyState title="Error" description="Could not load deferrals." />;

  if (!data || data.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Deferred" description="Deferred orders queue" />
        <EmptyState title="No deferrals" description="All orders are on schedule." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Deferred" description="Deferred orders queue" />
      <div className="grid gap-4 md:grid-cols-2">
        {data.map((d) => (
          <div key={d.id} className="p-4 bg-white border rounded shadow-sm">
            <h4 className="font-medium">{`#${d.id}`}</h4>
            <p className="text-xs">{d.reason_text}</p>
            <span
              className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded ${
                d.reason_class === 'UNAVOIDABLE'
                  ? 'bg-gray-100 text-gray-800'
                  : d.reason_class === 'CHOICE'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {d.reason_class}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
