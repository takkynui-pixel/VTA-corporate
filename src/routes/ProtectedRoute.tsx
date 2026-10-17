import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center text-slate-500">
      กำลังโหลด…
    </div>
  );
}

/** UX เท่านั้น: บังคับ Login ก่อนเข้าหน้า (ความปลอดภัยจริงอยู่ที่ RLS) */
export function ProtectedRoute() {
  const { loading, session } = useAuth();
  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function AdminRoute() {
  const { loading, isAdmin } = useAuth();
  if (loading) return <Spinner />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}
