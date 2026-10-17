/** โดเมนที่อนุญาต (ต้องตรงกับ constraint portal_apps_allowed_host ในฐานข้อมูล) */
export const ALLOWED_DOMAIN = "vta-service.com";

export function isSafeHttpsUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !!u.hostname;
  } catch {
    return false;
  }
}

/** https และเป็น vta-service.com หรือ subdomain เท่านั้น */
export function isAllowedUrl(value: string): boolean {
  try {
    const u = new URL(value);
    if (u.protocol !== "https:" || u.username || u.password) return false;
    const h = u.hostname.toLowerCase();
    return h === ALLOWED_DOMAIN || h.endsWith("." + ALLOWED_DOMAIN);
  } catch {
    return false;
  }
}

export function openExternal(url: string): void {
  if (!isAllowedUrl(url)) {
    alert("ลิงก์ของระบบนี้ไม่ถูกต้อง กรุณาแจ้งผู้ดูแลระบบ");
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
