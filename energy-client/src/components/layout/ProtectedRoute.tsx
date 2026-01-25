import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "ADMIN" | "USER";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

// Admins can access both admin and user routes
  // Users can only access user routes
  if (requiredRole === "ADMIN" && user?.role !== "ADMIN") {
    return <Navigate to="/user" replace />;
  }

  return <>{children}</>;
}
