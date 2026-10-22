import { AppWindow, ExternalLink, Star } from "lucide-react";
import type { PortalApp } from "../features/apps/appsApi";
import { COLORS, ICONS } from "../lib/appStyle";
import { openExternal } from "../lib/url";

export function AppCard({
  app,
  isFavorite,
  onToggleFavorite,
}: {
  app: PortalApp;
  isFavorite: boolean;
  onToggleFavorite: (app: PortalApp) => void;
}) {
  const Icon = ICONS[app.icon] ?? AppWindow;
  const color = COLORS[app.color] ?? COLORS.blue;
  return (
    <div className="relative flex flex-col rounded-[1.5rem] bg-white p-5 shadow-[0_10px_28px_-14px_rgba(30,64,175,0.35)] ring-1 ring-slate-100 transition hover:-translate-y-0.5 hover:shadow-[0_14px_32px_-12px_rgba(30,64,175,0.4)]">
      <button
        type="button"
        aria-label={isFavorite ? "เอาออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
        onClick={() => onToggleFavorite(app)}
        className="absolute right-3 top-3 rounded-full p-2 text-slate-300 hover:text-amber-500"
      >
        <Star className={`h-5 w-5 ${isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
      </button>
      <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${color.tile}`}>
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold text-ink">{app.name}</h3>
      <p className="mt-0.5 flex-1 text-sm text-slate-500">{app.description ?? ""}</p>
      <button
        type="button"
        onClick={() => openExternal(app.url)}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-b from-brand-soft to-brand-dark px-5 py-2.5 text-sm font-medium text-white shadow-md transition hover:brightness-110"
      >
        เปิดระบบ <ExternalLink className="h-4 w-4" />
      </button>
    </div>
  );
}
