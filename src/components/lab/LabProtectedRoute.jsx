import React from 'react';
import { Navigate } from 'react-router-dom';
import { useLabAuth } from '../../context/LabAuthContext';

export default function LabProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useLabAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/mokinelab/login" replace />;
  }

  return children;
}
