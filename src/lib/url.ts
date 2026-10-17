/** อนุญาตเฉพาะ https:// เท่านั้น (ฐานข้อมูลตรวจซ้ำอีกชั้นด้วย constraint) */
export function isSafeHttpsUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !!u.hostname;
  } catch {
    return false;
  }
}

export function openExternal(url: string): void {
  if (!isSafeHttpsUrl(url)) {
    alert("ลิงก์ของระบบนี้ไม่ถูกต้อง กรุณาแจ้งผู้ดูแลระบบ");
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
