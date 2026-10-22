import { useEffect, useState, type FormEvent } from "react";
import { AppWindow } from "lucide-react";
import {
  createPortalApp,
  getAllPortalApps,
  updatePortalApp,
  type PortalApp,
} from "../features/apps/appsApi";
import { isAllowedUrl } from "../lib/url";
import {
  CATEGORIES,
  COLORS,
  COLOR_KEYS,
  ICONS,
  ICON_KEYS,
} from "../lib/appStyle";

type Draft = {
  code: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  sort_order: number;
  category: string;
  color: string;
};

const EMPTY: Draft = {
  code: "",
  name: "",
  description: "",
  url: "https://",
  icon: "app-window",
  sort_order: 10,
  category: "other",
  color: "blue",
};

const input = "w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm";

function CategorySelect(props: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <select
      className={`${input} ${props.className ?? ""}`}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
    >
      {CATEGORIES.map((c) => (
        <option key={c.key} value={c.key}>
          {c.label}
        </option>
      ))}
    </select>
  );
}

function ColorSelect(props: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <select
      className={`${input} ${props.className ?? ""}`}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
    >
      {COLOR_KEYS.map((k) => (
        <option key={k} value={k}>
          {COLORS[k].label}
        </option>
      ))}
    </select>
  );
}

function IconSelect(props: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <select
      className={`${input} ${props.className ?? ""}`}
      value={props.value}
      onChange={(e) => props.onChange(e.target.value)}
    >
      {ICON_KEYS.map((k) => (
        <option key={k}>{k}</option>
      ))}
    </select>
  );
}

export default function AdminAppsPage() {
  const [apps, setApps] = useState<PortalApp[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setApps(await getAllPortalApps());
    } catch {
      setErr("โหลดข้อมูลไม่สำเร็จ (ต้องเป็น Portal Admin)");
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function saveRow(app: PortalApp) {
    setMsg(null);
    setErr(null);
    if (!isAllowedUrl(app.url)) {
      setErr(`URL ของ ${app.name} ต้องเป็น https:// และโดเมน vta-service.com`);
      return;
    }
    try {
      await updatePortalApp(app.id, {
        name: app.name,
        description: app.description,
        url: app.url,
        icon: app.icon,
        sort_order: app.sort_order,
        is_active: app.is_active,
        category: app.category,
        color: app.color,
      });
      setMsg(`บันทึก ${app.name} แล้ว`);
    } catch {
      setErr(
        "บันทึกไม่สำเร็จ — ถ้าเพิ่งอัปเดตเวอร์ชัน ให้รัน migration 20261022000004 ใน Supabase ก่อน",
      );
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    if (!isAllowedUrl(draft.url)) {
      setErr("URL ต้องเป็น https:// และโดเมน vta-service.com");
      return;
    }
    try {
      await createPortalApp({
        ...draft,
        description: draft.description || null,
        is_active: true,
      });
      setDraft(EMPTY);
      setMsg("เพิ่มระบบใหม่แล้ว (ยังไม่มีผู้ใช้เห็น จนกว่าจะกำหนดสิทธิ์ให้บทบาท)");
      load();
    } catch {
      setErr("เพิ่มไม่สำเร็จ (code อาจซ้ำ หรือยังไม่ได้รัน migration 20261022000004)");
    }
  }

  function patch(id: string, p: Partial<PortalApp>) {
    setApps((list) => list.map((a) => (a.id === id ? { ...a, ...p } : a)));
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-brand">จัดการระบบ</h1>
      <p className="mb-4 text-sm text-slate-500">
        แก้ไข URL หมวดหมู่ สี Icon เปิด/ปิดใช้งาน และเพิ่มระบบใหม่
        ส่วนการกำหนดสิทธิ์รายบทบาททำผ่าน Supabase (SQL / Dashboard)
      </p>
      {msg && <p className="mb-3 text-sm text-emerald-700">{msg}</p>}
      {err && <p className="mb-3 text-sm text-red-600">{err}</p>}

      <div className="space-y-3">
        {apps.map((a) => {
          const Icon = ICONS[a.icon] ?? AppWindow;
          const color = COLORS[a.color] ?? COLORS.blue;
          return (
            <div key={a.id} className="rounded-[1.5rem] bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${color.tile}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-xs text-slate-400">code: {a.code}</span>
              </div>

              <div className="grid gap-2 md:grid-cols-12">
                <input
                  className={`${input} md:col-span-3`}
                  value={a.name}
                  placeholder="ชื่อระบบ"
                  onChange={(e) => patch(a.id, { name: e.target.value })}
                />
                <input
                  className={`${input} md:col-span-4`}
                  value={a.description ?? ""}
                  placeholder="คำอธิบาย"
                  onChange={(e) => patch(a.id, { description: e.target.value })}
                />
                <input
                  className={`${input} md:col-span-5`}
                  value={a.url}
                  onChange={(e) => patch(a.id, { url: e.target.value })}
                />

                <CategorySelect
                  className="md:col-span-3"
                  value={a.category}
                  onChange={(v) => patch(a.id, { category: v })}
                />
                <ColorSelect
                  className="md:col-span-2"
                  value={a.color}
                  onChange={(v) => patch(a.id, { color: v })}
                />
                <IconSelect
                  className="md:col-span-2"
                  value={a.icon}
                  onChange={(v) => patch(a.id, { icon: v })}
                />
                <input
                  type="number"
                  title="ลำดับ"
                  className={`${input} md:col-span-1`}
                  value={a.sort_order}
                  onChange={(e) => patch(a.id, { sort_order: Number(e.target.value) })}
                />
                <div className="flex items-center gap-3 md:col-span-4">
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={a.is_active}
                      onChange={(e) => patch(a.id, { is_active: e.target.checked })}
                    />
                    เปิดใช้งาน
                  </label>
                  <button
                    type="button"
                    onClick={() => saveRow(a)}
                    className="ml-auto rounded-full bg-brand px-5 py-1.5 text-sm text-white hover:bg-brand-dark"
                  >
                    บันทึก
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={onCreate}
        className="mt-8 grid gap-2 rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-4 md:grid-cols-12"
      >
        <div className="text-sm font-medium text-ink md:col-span-12">เพิ่มระบบใหม่</div>
        <input
          required
          className={`${input} md:col-span-2`}
          placeholder="code (เช่น leave)"
          pattern="[a-z0-9_-]+"
          title="ใช้ตัวพิมพ์เล็ก ตัวเลข _ หรือ - เท่านั้น"
          value={draft.code}
          onChange={(e) => setDraft({ ...draft, code: e.target.value })}
        />
        <input
          required
          className={`${input} md:col-span-3`}
          placeholder="ชื่อระบบ"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
        <input
          className={`${input} md:col-span-3`}
          placeholder="คำอธิบาย"
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
        />
        <input
          required
          className={`${input} md:col-span-4`}
          value={draft.url}
          onChange={(e) => setDraft({ ...draft, url: e.target.value })}
        />
        <CategorySelect
          className="md:col-span-3"
          value={draft.category}
          onChange={(v) => setDraft({ ...draft, category: v })}
        />
        <ColorSelect
          className="md:col-span-2"
          value={draft.color}
          onChange={(v) => setDraft({ ...draft, color: v })}
        />
        <IconSelect
          className="md:col-span-2"
          value={draft.icon}
          onChange={(v) => setDraft({ ...draft, icon: v })}
        />
        <button
          type="submit"
          className="rounded-full bg-emerald-600 px-3 py-1.5 text-sm text-white md:col-span-3"
        >
          + เพิ่มระบบ
        </button>
      </form>
    </div>
  );
}
