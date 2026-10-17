import { NavLink, Outlet } from "react-router-dom";
import { LogOut, Settings } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export function Layout() {
  const { profile, session, isAdmin, signOut } = useAuth();
  const name = profile?.display_name || session?.user.email || "";
  const initial = (name[0] ?? "?").toUpperCase();

  const pill = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition ${
      isActive
        ? "bg-linear-to-b from-brand-soft to-brand-dark text-white shadow-md"
        : "bg-canvas text-ink hover:bg-slate-100"
    }`;

  return (
    <div className="mx-auto my-3 max-w-[1500px] rounded-[2rem] bg-canvas p-3 md:my-7 md:rounded-[2.5rem] md:p-8">
      <header className="mb-8 flex flex-wrap items-center gap-3 rounded-[1.75rem] bg-white px-4 py-3 shadow-sm md:flex-nowrap md:px-7">
        <NavLink to="/" className="shrink-0">
          <img src="/logo.png" alt="VTA Service Co., Ltd." className="h-10 w-auto md:h-12" />
        </NavLink>

        <nav className="order-last flex w-full gap-2 overflow-x-auto md:order-none md:w-auto md:flex-1 md:justify-center">
          <NavLink to="/" end className={pill}>
            ภาพรวม
          </NavLink>
          {isAdmin && (
            <>
              <NavLink to="/admin/apps" className={pill}>
                จัดการระบบ
              </NavLink>
              <NavLink to="/admin/users" className={pill}>
                ผู้ใช้และสิทธิ์
              </NavLink>
            </>
          )}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <NavLink
            to="/security"
            aria-label="บัญชีและความปลอดภัย"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas text-ink hover:bg-slate-100"
          >
            <Settings className="h-5 w-5" />
          </NavLink>
          <button
            type="button"
            onClick={signOut}
            aria-label="ออกจากระบบ"
            title={`${name} · ออกจากระบบ`}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas text-ink hover:bg-slate-100"
          >
            <LogOut className="h-5 w-5" />
          </button>
          <div
            title={name}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-brand font-semibold text-white"
          >
            {initial}
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
