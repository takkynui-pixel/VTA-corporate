import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, RefreshCw, Search } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getPortalApps, type PortalApp } from "../features/apps/appsApi";
import {
  addFavorite,
  getFavoriteIds,
  removeFavorite,
} from "../features/favorites/favoritesApi";
import { AppCard } from "../components/AppCard";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "สวัสดีตอนเช้า";
  if (h < 17) return "สวัสดีตอนบ่าย";
  return "สวัสดีตอนเย็น";
}

function timeLabel(d: Date): string {
  return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

export default function DashboardPage() {
  const { session, profile } = useAuth();
  const userId = session!.user.id;
  const name = profile?.display_name || session?.user.email?.split("@")[0] || "";

  const [apps, setApps] = useState<PortalApp[]>([]);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState(new Date());

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return Promise.all([getPortalApps(), getFavoriteIds()])
      .then(([a, f]) => {
        setApps(a);
        setFavs(new Set(f));
        setUpdatedAt(new Date());
      })
      .catch(() => setError("โหลดรายการระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFav = useCallback(
    async (app: PortalApp) => {
      const isFav = favs.has(app.id);
      const next = new Set(favs);
      if (isFav) next.delete(app.id);
      else next.add(app.id);
      setFavs(next);
      try {
        if (isFav) await removeFavorite(userId, app.id);
        else await addFavorite(userId, app.id);
      } catch {
        setFavs(favs); // ย้อนกลับเมื่อบันทึกไม่สำเร็จ
      }
    },
    [favs, userId],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = apps.filter(
      (a) =>
        !q ||
        a.name.toLowerCase().includes(q) ||
        (a.description ?? "").toLowerCase().includes(q),
    );
    return [...list].sort(
      (a, b) =>
        Number(favs.has(b.id)) - Number(favs.has(a.id)) ||
        a.sort_order - b.sort_order,
    );
  }, [apps, favs, query]);

  const pillBtn =
    "inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm shadow-sm";

  return (
    <div>
      <h1 className="text-4xl font-semibold text-brand md:text-5xl">
        {greeting()}, {name}!
      </h1>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={load} className={`${pillBtn} hover:bg-slate-50`}>
          <RefreshCw className="h-4 w-4" /> รีเฟรช
        </button>
        <span className={pillBtn}>ข้อมูล ณ {timeLabel(updatedAt)} น.</span>
        <div className="relative ml-auto w-full md:w-72">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาระบบ…"
            className="w-full rounded-full bg-white py-3 pl-11 pr-4 text-sm shadow-sm outline-none focus:ring-2 focus:ring-brand-soft"
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col justify-between rounded-[2rem] bg-linear-to-br from-brand-dark via-brand to-brand-soft p-6 text-white shadow-lg">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand">
            <Box className="h-6 w-6" />
          </div>
          <div className="mt-8">
            <div className="text-lg font-medium">ระบบที่เข้าถึงได้</div>
            <div className="text-6xl font-semibold leading-tight">{apps.length}</div>
            <div className="mt-1 text-sm text-blue-100">
              รายการโปรด {favs.size} ระบบ · เปิดในแท็บใหม่
            </div>
          </div>
        </div>

        {filtered.map((app) => (
          <AppCard
            key={app.id}
            app={app}
            isFavorite={favs.has(app.id)}
            onToggleFavorite={toggleFav}
          />
        ))}
      </div>

      {loading && <p className="mt-6 text-slate-500">กำลังโหลด…</p>}
      {error && <p className="mt-6 text-red-600">{error}</p>}
      {!loading && !error && filtered.length === 0 && (
        <p className="mt-6 rounded-[1.5rem] bg-white p-6 text-center text-slate-500">
          {apps.length === 0
            ? "ยังไม่มีระบบที่คุณมีสิทธิ์เข้าถึง กรุณาติดต่อผู้ดูแลระบบ"
            : "ไม่พบระบบที่ค้นหา"}
        </p>
      )}
    </div>
  );
}
