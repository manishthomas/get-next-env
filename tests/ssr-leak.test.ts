import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createEnv } from "../src/index.js";

describe("SSR Leak Prevention", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    // biome-ignore lint/performance/noDelete: Reset window for server environment simulation
    delete (globalThis as any).window;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("SSR leak: secret in process.env is NOT returned by .get()", () => {
    process.env.DATABASE_URL = "postgres://user:password@localhost:5432/db";
    process.env.PUBLIC_SITE_URL = "https://example.com";

    const env = createEnv({
      PUBLIC_SITE_URL: "PUBLIC_SITE_URL",
    });

    expect(env.get("PUBLIC_SITE_URL")).toBe("https://example.com");
    expect((env.get as any)("DATABASE_URL")).toBeUndefined();
    expect(env.__serialize()).not.toContain("postgres://");
  });
});
