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

const TONES = [
  "bg-blue-50 text-blue-700",
  "bg-emerald-50 text-emerald-700",
  "bg-violet-50 text-violet-700",
  "bg-amber-50 text-amber-700",
  "bg-rose-50 text-rose-700",
];

export function AppCard({
  app,
  index,
  isFavorite,
  onToggleFavorite,
}: {
  app: PortalApp;
  index: number;
  isFavorite: boolean;
  onToggleFavorite: (app: PortalApp) => void;
}) {
  const Icon = ICONS[app.icon] ?? AppWindow;
  return (
    <div className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <button
        type="button"
        aria-label={isFavorite ? "เอาออกจากรายการโปรด" : "เพิ่มในรายการโปรด"}
        onClick={() => onToggleFavorite(app)}
        className="absolute right-3 top-3 rounded-full p-2 text-slate-300 hover:text-amber-500"
      >
        <Star
          className={`h-5 w-5 ${isFavorite ? "fill-amber-400 text-amber-400" : ""}`}
        />
      </button>
      <div
        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${TONES[index % TONES.length]}`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-navy">{app.name}</h3>
      <p className="mt-1 flex-1 text-sm text-slate-500">
        {app.description ?? ""}
      </p>
      <button
        type="button"
        onClick={() => openExternal(app.url)}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-medium text-white hover:bg-navy-soft"
      >
        เปิดระบบ <ExternalLink className="h-4 w-4" />
      </button>
    </div>
  );
}
