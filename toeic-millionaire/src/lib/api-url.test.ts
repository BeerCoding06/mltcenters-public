import { describe, expect, it } from "vitest";
import { apiUrl, APP_BASE_PATH } from "./api-url";

describe("apiUrl", () => {
  it("prefixes with /millionaire", () => {
    expect(APP_BASE_PATH).toBe("/millionaire");
    expect(apiUrl("/api/game/start")).toBe("/millionaire/api/game/start");
    expect(apiUrl("api/quiz/next")).toBe("/millionaire/api/quiz/next");
  });
});
