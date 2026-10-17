import {
  AppWindow,
  Calculator,
  Clock,
  ExternalLink,
  FileText,
  Package,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { PortalApp } from "../features/apps/appsApi";
import { openExternal } from "../lib/url";

const ICONS: Record<string, LucideIcon> = {
  clock: Clock,
  package: Package,
  users: Users,
  calculator: Calculator,
  "file-text": FileText,
  "app-window": AppWindow,
};

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
  return (
    <div className="relative flex flex-col rounded-[2rem] bg-white p-6 shadow-sm transition hover:shadow-lg">
      <button
        type="button"
        aria-label={isFavorite ? "เอาออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
        onClick={() => onToggleFavorite(app)}
        className="absolute right-4 top-4 rounded-full p-2 text-slate-300 hover:text-amber-500"
      >
        <Star className={`h-5 w-5 ${isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
      </button>
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-brand">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-xl font-semibold text-ink">{app.name}</h3>
      <p className="mt-1 flex-1 text-sm text-slate-500">{app.description ?? ""}</p>
      <button
        type="button"
        onClick={() => openExternal(app.url)}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-b from-brand-soft to-brand-dark px-5 py-3 text-sm font-medium text-white shadow-md transition hover:brightness-110"
      >
        เปิดระบบ <ExternalLink className="h-4 w-4" />
      </button>
    </div>
  );
}
