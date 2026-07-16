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
    const destination = user.role === "Admin"
      ? "/admin"
      : user.role === "Customer"
        ? "/customer/dashboard"
        : "/collaborator/marketplace";
    return <Navigate to={destination} replace />;
  }

  return <>{children}</>;
}
