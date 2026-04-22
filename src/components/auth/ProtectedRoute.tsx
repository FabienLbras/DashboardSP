import React, { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  console.log('[ProtectedRoute] render — loading:', loading, 'user:', user?.email ?? null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    console.log('[ProtectedRoute] pas de user → redirect /signin');
    return <Navigate to="/signin" replace />;
  }
  if (user.must_change_password) {
    console.log('[ProtectedRoute] must_change_password → redirect /change-password');
    return <Navigate to="/change-password" replace />;
  }
  return <>{children}</>;
}