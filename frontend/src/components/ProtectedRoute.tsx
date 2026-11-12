import { Navigate, Outlet, useLocation } from "react-router";
import { useMe } from "../features/auth/hooks";

export function ProtectedRoute() {
  const { data: user, isPending } = useMe();
  const location = useLocation();

  if (isPending) return <p className="p-8 text-muted">Loading…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
