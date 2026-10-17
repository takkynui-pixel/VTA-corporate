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

/** หน้า Admin: ต้องเป็น portal_admin และยืนยัน MFA (aal2) แล้ว */
export function AdminRoute() {
  const { loading, isAdmin, aal } = useAuth();
  if (loading) return <Spinner />;
  if (!isAdmin) return <Navigate to="/" replace />;
  if (aal !== "aal2") return <Navigate to="/security" replace />;
  return <Outlet />;
}
