import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';
import { useGetLoading } from '../api/pending/loading';

export const LoadingPage: React.FC = () => {
  const { data, isLoading, isError } = useGetLoading();

  if (isLoading) return <EmptyState title="Loading bays…" description="Please wait." />;
  if (isError) return <EmptyState title="Error" description="Could not load loading data." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Loading Coordination" description="Dock status and shortfall" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-4 bg-white border rounded shadow-sm">
          <h4 className="font-medium">Shortfall</h4>
          <p className="text-2xl">{data.shortfall}</p>
        </div>
        <div className="p-4 bg-white border rounded shadow-sm">
          <h4 className="font-medium">Pending Orders</h4>
          <p className="text-2xl">{data.pendingOrders}</p>
        </div>
        <div className="p-4 bg-white border rounded shadow-sm">
          <h4 className="font-medium">Vehicles Loading</h4>
          <p className="text-2xl">{data.vehiclesLoading}</p>
        </div>
      </div>
    </div>
  );
};
