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
import { CATEGORIES, categoryKeyOf } from "../lib/appStyle";

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
  const [activeCat, setActiveCat] = useState("all");
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

  // จำนวนระบบในแต่ละหมวด (นับจากทั้งหมดที่ผู้ใช้มีสิทธิ์)
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of apps) {
      const k = categoryKeyOf(a.category);
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [apps]);

  // แบ่งกลุ่มตามหมวด หลังกรองด้วยคำค้นและหมวดที่เลือก
  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = apps.filter(
      (a) =>
        (!q ||
          a.name.toLowerCase().includes(q) ||
          (a.description ?? "").toLowerCase().includes(q)) &&
        (activeCat === "all" || categoryKeyOf(a.category) === activeCat),
    );
    return CATEGORIES.map((c) => ({
      ...c,
      apps: list
        .filter((a) => categoryKeyOf(a.category) === c.key)
        .sort(
          (a, b) =>
            Number(favs.has(b.id)) - Number(favs.has(a.id)) ||
            a.sort_order - b.sort_order,
        ),
    })).filter((s) => s.apps.length > 0);
  }, [apps, favs, query, activeCat]);

  const pillBtn =
    "inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm shadow-sm";

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand md:text-2xl">
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

      {/* สรุป + ตัวกรองหมวด */}
      <div className="mt-6 flex flex-col gap-4 rounded-[2rem] bg-linear-to-br from-brand-dark via-brand to-brand-soft p-6 text-white shadow-lg md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-brand">
            <Box className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm text-blue-100">ระบบที่เข้าถึงได้</div>
            <div className="text-4xl font-semibold leading-tight">{apps.length}</div>
            <div className="text-xs text-blue-100">
              รายการโปรด {favs.size} ระบบ · เปิดในแท็บใหม่
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="หมวดหมู่ระบบ">
          <button
            type="button"
            role="tab"
            aria-selected={activeCat === "all"}
            onClick={() => setActiveCat("all")}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              activeCat === "all" ? "bg-white text-brand" : "bg-white/15 text-white hover:bg-white/25"
            }`}
          >
            ทั้งหมด · {apps.length}
          </button>
          {CATEGORIES.filter((c) => (counts.get(c.key) ?? 0) > 0).map((c) => (
            <button
              key={c.key}
              type="button"
              role="tab"
              aria-selected={activeCat === c.key}
              onClick={() => setActiveCat(c.key)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                activeCat === c.key ? "bg-white text-brand" : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${c.dot} ring-2 ring-white/70`} />
              {c.label} · {counts.get(c.key)}
            </button>
          ))}
        </div>
      </div>

      {/* การ์ดแยกตามหมวด */}
      <div className="mt-6 grid items-start gap-5 xl:grid-cols-2">
        {sections.map((s) => (
          <section
            key={s.key}
            className={`rounded-[2rem] bg-white p-5 shadow-sm md:p-6 ${
              s.apps.length > 2 ? "xl:col-span-2" : ""
            }`}
          >
            <header className="mb-4 flex items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${s.dot}`} />
              <h2 className="text-lg font-semibold text-ink">{s.label}</h2>
              <span className="rounded-full bg-canvas px-2.5 py-0.5 text-xs text-slate-500">
                {s.apps.length} ระบบ
              </span>
              <span className="ml-auto hidden text-xs text-slate-400 sm:inline">{s.hint}</span>
            </header>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {s.apps.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  isFavorite={favs.has(app.id)}
                  onToggleFavorite={toggleFav}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {loading && <p className="mt-6 text-slate-500">กำลังโหลด…</p>}
      {error && <p className="mt-6 text-red-600">{error}</p>}
      {!loading && !error && sections.length === 0 && (
        <p className="mt-6 rounded-[1.5rem] bg-white p-6 text-center text-slate-500">
          {apps.length === 0
            ? "ยังไม่มีระบบที่คุณมีสิทธิ์เข้าถึง กรุณาติดต่อผู้ดูแลระบบ"
            : "ไม่พบระบบที่ค้นหา"}
        </p>
      )}
    </div>
  );
}
