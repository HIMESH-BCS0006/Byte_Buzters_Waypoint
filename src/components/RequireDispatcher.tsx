import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { WrongRolePage } from '../pages/WrongRolePage';
import { LoadingState } from './LoadingState';

interface RequireDispatcherProps {
  children: React.ReactNode;
}

export const RequireDispatcher: React.FC<RequireDispatcherProps> = ({ children }) => {
  const { token, user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingState message="Verifying dispatcher credentials..." />
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (role !== 'dispatcher') {
    return <WrongRolePage />;
  }

  return <>{children}</>;
};
