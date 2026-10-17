import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && session) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="mb-6 text-center">
          <div className="text-xl font-bold text-navy">VTA WORKSPACE</div>
          <div className="text-sm text-slate-500">Corporate System Portal</div>
        </div>
        <label className="mb-1 block text-sm text-slate-600" htmlFor="email">
          อีเมล
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
        <label className="mb-1 block text-sm text-slate-600" htmlFor="pw">
          รหัสผ่าน
        </label>
        <input
          id="pw"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2"
        />
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-navy py-3 font-medium text-white hover:bg-navy-soft disabled:opacity-60"
        >
          {busy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
        </button>
        <p className="mt-4 text-center text-xs text-slate-400">
          บัญชีสร้างโดยผู้ดูแลระบบเท่านั้น
        </p>
      </form>
    </div>
  );
}
