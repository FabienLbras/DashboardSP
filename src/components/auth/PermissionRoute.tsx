import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AppPermission, hasPermission } from "../../lib/permissions";

interface PermissionRouteProps {
  children: ReactNode;
  permission: AppPermission;
  fallbackPath?: string;
}

export default function PermissionRoute({
  children,
  permission,
  fallbackPath = "/",
}: PermissionRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (!hasPermission(user.role, permission)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}
