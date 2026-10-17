import { useEffect, useState, type FormEvent } from "react";
import {
  createPortalApp,
  getAllPortalApps,
  updatePortalApp,
  type PortalApp,
} from "../features/apps/appsApi";
import { isSafeHttpsUrl } from "../lib/url";

type Draft = {
  code: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  sort_order: number;
};

const EMPTY: Draft = {
  code: "",
  name: "",
  description: "",
  url: "https://",
  icon: "app-window",
  sort_order: 10,
};

const ICON_OPTIONS = [
  "clock",
  "package",
  "users",
  "calculator",
  "file-text",
  "app-window",
];

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
    if (!isSafeHttpsUrl(app.url)) {
      setErr(`URL ของ ${app.name} ต้องขึ้นต้นด้วย https://`);
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
      });
      setMsg(`บันทึก ${app.name} แล้ว`);
    } catch {
      setErr("บันทึกไม่สำเร็จ");
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    if (!isSafeHttpsUrl(draft.url)) {
      setErr("URL ต้องขึ้นต้นด้วย https://");
      return;
    }
    try {
      await createPortalApp({
        ...draft,
        description: draft.description || null,
        is_active: true,
      });
      setDraft(EMPTY);
      setMsg("เพิ่มระบบใหม่แล้ว");
      load();
    } catch {
      setErr("เพิ่มไม่สำเร็จ (code อาจซ้ำ)");
    }
  }

  function patch(id: string, p: Partial<PortalApp>) {
    setApps((list) => list.map((a) => (a.id === id ? { ...a, ...p } : a)));
  }

  const input = "w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm";

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-navy">จัดการระบบ</h1>
      <p className="mb-4 text-sm text-slate-500">
        แก้ไข URL เปิด/ปิดใช้งาน และเพิ่มระบบใหม่ ส่วนการกำหนดสิทธิ์รายบทบาท
        ทำผ่าน Supabase (SQL / Dashboard)
      </p>
      {msg && <p className="mb-3 text-sm text-emerald-700">{msg}</p>}
      {err && <p className="mb-3 text-sm text-red-600">{err}</p>}

      <div className="space-y-3">
        {apps.map((a) => (
          <div
            key={a.id}
            className="grid gap-2 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-12"
          >
            <div className="md:col-span-2">
              <div className="text-xs text-slate-400">{a.code}</div>
              <input
                className={input}
                value={a.name}
                onChange={(e) => patch(a.id, { name: e.target.value })}
              />
            </div>
            <input
              className={`${input} md:col-span-3`}
              value={a.description ?? ""}
              placeholder="คำอธิบาย"
              onChange={(e) => patch(a.id, { description: e.target.value })}
            />
            <input
              className={`${input} md:col-span-3`}
              value={a.url}
              onChange={(e) => patch(a.id, { url: e.target.value })}
            />
            <select
              className={`${input} md:col-span-1`}
              value={a.icon}
              onChange={(e) => patch(a.id, { icon: e.target.value })}
            >
              {ICON_OPTIONS.map((i) => (
                <option key={i}>{i}</option>
              ))}
            </select>
            <input
              type="number"
              className={`${input} md:col-span-1`}
              value={a.sort_order}
              onChange={(e) =>
                patch(a.id, { sort_order: Number(e.target.value) })
              }
            />
            <div className="flex items-center gap-2 md:col-span-2">
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
                className="rounded-lg bg-navy px-3 py-1.5 text-sm text-white"
              >
                บันทึก
              </button>
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={onCreate}
        className="mt-8 grid gap-2 rounded-xl border border-dashed border-slate-300 bg-white p-4 md:grid-cols-12"
      >
        <input
          required
          className={`${input} md:col-span-2`}
          placeholder="code (เช่น leave)"
          value={draft.code}
          onChange={(e) => setDraft({ ...draft, code: e.target.value })}
        />
        <input
          required
          className={`${input} md:col-span-2`}
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
          className={`${input} md:col-span-3`}
          value={draft.url}
          onChange={(e) => setDraft({ ...draft, url: e.target.value })}
        />
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white md:col-span-2"
        >
          + เพิ่มระบบ
        </button>
      </form>
    </div>
  );
}
