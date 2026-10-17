import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getPortalApps, type PortalApp } from "../features/apps/appsApi";
import {
  addFavorite,
  getFavoriteIds,
  removeFavorite,
} from "../features/favorites/favoritesApi";
import { AppCard } from "../components/AppCard";

export default function DashboardPage() {
  const { session, profile } = useAuth();
  const userId = session!.user.id;

  const [apps, setApps] = useState<PortalApp[]>([]);
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getPortalApps(), getFavoriteIds()])
      .then(([a, f]) => {
        setApps(a);
        setFavs(new Set(f));
      })
      .catch(() => setError("โหลดรายการระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"))
      .finally(() => setLoading(false));
  }, []);

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
    // รายการโปรดขึ้นก่อน แล้วเรียงตาม sort_order
    return [...list].sort(
      (a, b) =>
        Number(favs.has(b.id)) - Number(favs.has(a.id)) ||
        a.sort_order - b.sort_order,
    );
  }, [apps, favs, query]);

  return (
    <div>
      <div className="mb-6 rounded-2xl bg-navy p-6 text-white">
        <div className="text-xs tracking-widest text-slate-300">
          WELCOME BACK
        </div>
        <h1 className="mt-1 text-2xl font-bold">
          {profile?.display_name
            ? `สวัสดี ${profile.display_name}`
            : "ศูนย์รวมระบบงานบริษัท"}
        </h1>
        <p className="text-sm text-slate-300">เข้าถึงทุกระบบได้ในที่เดียว</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาระบบ…"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4"
        />
      </div>

      {loading && <p className="text-slate-500">กำลังโหลด…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <p className="rounded-xl bg-white p-6 text-center text-slate-500">
          {apps.length === 0
            ? "ยังไม่มีระบบที่คุณมีสิทธิ์เข้าถึง กรุณาติดต่อผู้ดูแลระบบ"
            : "ไม่พบระบบที่ค้นหา"}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((app, i) => (
          <AppCard
            key={app.id}
            app={app}
            index={i}
            isFavorite={favs.has(app.id)}
            onToggleFavorite={toggleFav}
          />
        ))}
      </div>
    </div>
  );
}
