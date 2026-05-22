import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    const fallback = user.role === "vendor" ? "/vendor" : user.role === "admin" ? "/admin" : user.role === "customer" ? "/auctions" : "/";
    return <Navigate to={fallback} replace />;
  }

  return children;
}
