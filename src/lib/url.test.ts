import { describe, expect, it } from "vitest";
import { isAllowedUrl, isSafeHttpsUrl } from "./url";

describe("isSafeHttpsUrl", () => {
  it("accepts https and rejects others", () => {
    expect(isSafeHttpsUrl("https://a.example.com")).toBe(true);
    expect(isSafeHttpsUrl("http://x.com")).toBe(false);
    expect(isSafeHttpsUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpsUrl("")).toBe(false);
  });
});

describe("isAllowedUrl", () => {
  it("accepts company domain and subdomains", () => {
    expect(isAllowedUrl("https://vta-service.com")).toBe(true);
    expect(isAllowedUrl("https://checkin.vta-service.com/app?x=1")).toBe(true);
  });
  it("rejects look-alike and credential tricks", () => {
    expect(isAllowedUrl("https://evilvta-service.com")).toBe(false);
    expect(isAllowedUrl("https://vta-service.com.evil.com")).toBe(false);
    expect(isAllowedUrl("https://vta-service.com@evil.com")).toBe(false);
    expect(isAllowedUrl("http://checkin.vta-service.com")).toBe(false);
  });
});
