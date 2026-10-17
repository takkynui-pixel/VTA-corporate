import { NavLink, Outlet } from "react-router-dom";
import { Home, LogOut, Settings } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export function Layout() {
  const { profile, session, roles, isAdmin, signOut } = useAuth();
  const name = profile?.display_name || session?.user.email || "";

  const link = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
      isActive ? "bg-white/15 text-white" : "text-slate-300 hover:bg-white/10"
    }`;

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-60 shrink-0 flex-col bg-navy p-4 md:flex">
        <div className="mb-8 px-2">
          <div className="text-lg font-bold tracking-wide text-white">
            VTA WORKSPACE
          </div>
          <div className="text-xs text-slate-300">Corporate System Portal</div>
        </div>
        <nav className="flex flex-col gap-1">
          <NavLink to="/" end className={link}>
            <Home className="h-4 w-4" /> หน้าหลัก
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin/apps" className={link}>
              <Settings className="h-4 w-4" /> จัดการระบบ
            </NavLink>
          )}
        </nav>
        <div className="mt-auto border-t border-white/10 pt-4 text-xs text-slate-300">
          <div className="truncate font-medium text-white">{name}</div>
          <div className="mb-3 truncate">{roles.join(", ")}</div>
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-2 text-slate-300 hover:text-white"
          >
            <LogOut className="h-4 w-4" /> ออกจากระบบ
          </button>
        </div>
      </aside>

      <div className="flex-1 pb-20 md:pb-0">
        <header className="flex items-center justify-between bg-navy px-4 py-3 md:hidden">
          <span className="font-bold text-white">VTA WORKSPACE</span>
          <button
            type="button"
            onClick={signOut}
            aria-label="ออกจากระบบ"
            className="text-slate-200"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </header>
        <main className="mx-auto max-w-6xl p-4 md:p-8">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 flex border-t border-slate-200 bg-white md:hidden">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center py-2 text-xs ${isActive ? "text-navy" : "text-slate-400"}`
          }
        >
          <Home className="h-5 w-5" /> หน้าหลัก
        </NavLink>
        {isAdmin && (
          <NavLink
            to="/admin/apps"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center py-2 text-xs ${isActive ? "text-navy" : "text-slate-400"}`
            }
          >
            <Settings className="h-5 w-5" /> จัดการ
          </NavLink>
        )}
      </nav>
    </div>
  );
}
