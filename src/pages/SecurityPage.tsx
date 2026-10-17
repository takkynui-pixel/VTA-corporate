import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

type Mode = "loading" | "verify" | "enroll" | "done";

export default function SecurityPage() {
  const { isAdmin, aal, refreshAal } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("loading");
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        setErr("โหลดข้อมูล MFA ไม่สำเร็จ");
        return;
      }
      const verified = data.totp[0];
      if (verified) {
        setFactorId(verified.id);
        setMode(aal === "aal2" ? "done" : "verify");
        return;
      }
      // ลบ factor ที่เริ่มสมัครค้างไว้ แล้วเริ่มใหม่
      for (const f of data.all.filter((x) => x.status === "unverified")) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const enr = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (enr.error || !enr.data) {
        setErr("เริ่มตั้งค่า MFA ไม่สำเร็จ");
        return;
      }
      setFactorId(enr.data.id);
      setQr(enr.data.totp.qr_code);
      setSecret(enr.data.totp.secret);
      setMode("enroll");
    })();
  }, [aal]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: code.trim(),
    });
    if (error) {
      setErr("รหัสไม่ถูกต้อง กรุณาลองใหม่");
      return;
    }
    await refreshAal();
    setMode("done");
    if (isAdmin) navigate("/admin/users", { replace: true });
  }

  return (
    <div className="mx-auto max-w-md rounded-[2rem] bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-brand">ความปลอดภัยบัญชี (MFA)</h1>
      {mode === "loading" && !err && <p className="mt-4 text-slate-500">กำลังโหลด…</p>}
      {err && <p className="mt-4 text-sm text-red-600">{err}</p>}

      {mode === "done" && (
        <p className="mt-4 text-emerald-700">ยืนยันตัวตนสองชั้นเรียบร้อยแล้ว</p>
      )}

      {(mode === "enroll" || mode === "verify") && (
        <form onSubmit={onSubmit} className="mt-4">
          {mode === "enroll" ? (
            <>
              <p className="mb-3 text-sm text-slate-600">
                ผู้ดูแลระบบต้องเปิดใช้ MFA: สแกน QR ด้วยแอป Authenticator
                (Google Authenticator, Microsoft Authenticator ฯลฯ) แล้วกรอกรหัส 6 หลัก
              </p>
              {qr && <img src={qr} alt="QR code สำหรับ MFA" className="mx-auto mb-2 h-44 w-44" />}
              <p className="mb-3 break-all text-center text-xs text-slate-400">
                หรือกรอกรหัสลับ: {secret}
              </p>
            </>
          ) : (
            <p className="mb-3 text-sm text-slate-600">
              กรอกรหัส 6 หลักจากแอป Authenticator เพื่อเข้าถึงหน้าผู้ดูแลระบบ
            </p>
          )}
          <input
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-3 text-center text-xl tracking-widest"
            placeholder="000000"
          />
          <button type="submit" className="w-full rounded-full bg-brand py-3 font-medium text-white hover:bg-brand-dark">
            ยืนยัน
          </button>
        </form>
      )}
    </div>
  );
}
