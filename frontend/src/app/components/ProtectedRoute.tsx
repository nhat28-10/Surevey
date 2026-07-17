import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { getCurrentUser } from "../services/authService";
import type { UserRole } from "../types/auth";

export function ProtectedRoute({ roles, children }: { roles?: UserRole[]; children: ReactNode }) {
  const location = useLocation();
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
