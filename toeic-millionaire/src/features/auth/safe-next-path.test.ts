import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-next-path";

describe("safeNextPath", () => {
  it("returns fallback for missing or unsafe values", () => {
    expect(safeNextPath(null)).toBe("/play");
    expect(safeNextPath(undefined)).toBe("/play");
    expect(safeNextPath("")).toBe("/play");
    expect(safeNextPath("//evil.com")).toBe("/play");
    expect(safeNextPath("https://evil.com")).toBe("/play");
  });

  it("allows same-origin relative paths", () => {
    expect(safeNextPath("/board/abc")).toBe("/board/abc");
    expect(safeNextPath("/play")).toBe("/play");
  });
});
