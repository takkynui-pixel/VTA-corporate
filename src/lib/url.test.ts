import { describe, expect, it } from "vitest";
import { isSafeHttpsUrl } from "./url";

describe("isSafeHttpsUrl", () => {
  it("accepts https", () => {
    expect(isSafeHttpsUrl("https://checkin.example.co.th/app")).toBe(true);
  });
  it("rejects http, javascript: and garbage", () => {
    expect(isSafeHttpsUrl("http://x.com")).toBe(false);
    expect(isSafeHttpsUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpsUrl("not a url")).toBe(false);
    expect(isSafeHttpsUrl("")).toBe(false);
  });
});
