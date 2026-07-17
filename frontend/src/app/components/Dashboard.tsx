import { Navigate } from "react-router";
import { getCurrentUser } from "../services/authService";
import { AdminProcessRequests } from "./AdminProcessRequests";
import { HelperMarketplace } from "./HelperMarketplace";
import { OwnerDashboard } from "./OwnerDashboard";

export function Dashboard() {
  const user = getCurrentUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "Admin") {
    return <AdminProcessRequests />;
  }

  if (user.role === "Customer") {
    return <OwnerDashboard />;
  }

  return <HelperMarketplace />;
}
