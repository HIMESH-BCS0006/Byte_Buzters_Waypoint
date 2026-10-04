import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { EmptyState } from '../components/EmptyState';

export const MonitoringPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Monitoring"
        description="Real-time delivery progress, vehicle tracking, and exception decisions"
      />
      <EmptyState
        title="Live Delivery Monitoring"
        description="Active vehicle progress, proof-of-delivery status, delay alerts, and driver exception decisions."
      />
    </div>
  );
};
