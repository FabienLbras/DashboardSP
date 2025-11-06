import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface PublicRouteProps {
  children: ReactNode;
}

/**
 * PublicRoute component that redirects authenticated users away from public pages
 * like signin/signup pages to the dashboard
 */
export default function PublicRoute({ children }: PublicRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If user is authenticated, redirect to dashboard
  return user ? <Navigate to="/" replace /> : <>{children}</>;
}