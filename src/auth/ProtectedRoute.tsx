import { ReactNode } from "react";
import { useAuth } from "../context/AuthContext"; 
import { checkPermission } from "./checkPermission";

interface ProtectedRouteProps {
  permission: string;
  children: ReactNode;
}

const ProtectedRoute = ({ permission, children }: ProtectedRouteProps) => {
  const { user } = useAuth(); // ← Changé de useUser() à useAuth()

  if (!user || !user.role || !checkPermission(user.role, permission)) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p>You do not have permission to access this page.</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;