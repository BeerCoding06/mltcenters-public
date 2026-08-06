import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { getAdminEmailAllowlist, isAdminEmail } from "./admin-guard";

describe("admin-guard", () => {
  const original = process.env.ADMIN_EMAIL_ALLOWLIST;

  beforeEach(() => {
    process.env.ADMIN_EMAIL_ALLOWLIST = "admin@example.com, editor@test.org";
  });

  afterEach(() => {
    process.env.ADMIN_EMAIL_ALLOWLIST = original;
  });

  it("parses comma-separated allowlist", () => {
    expect(getAdminEmailAllowlist()).toEqual([
      "admin@example.com",
      "editor@test.org",
    ]);
  });

  it("matches admin emails case-insensitively", () => {
    expect(isAdminEmail("Admin@Example.com")).toBe(true);
    expect(isAdminEmail("not@allowed.com")).toBe(false);
    expect(isAdminEmail(null)).toBe(false);
  });

  it("denies all when allowlist is empty", () => {
    process.env.ADMIN_EMAIL_ALLOWLIST = "";
    expect(isAdminEmail("admin@example.com")).toBe(false);
  });
});
