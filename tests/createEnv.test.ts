import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createEnv } from "../src/index.js";

describe("createEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    // biome-ignore lint/performance/noDelete: Reset window object for test environment
    delete (globalThis as any).window;
  });

  afterEach(() => {
    process.env = originalEnv;
    // biome-ignore lint/performance/noDelete: Reset window object for test environment
    delete (globalThis as any).window;
  });

  it("reads from process.env on server", () => {
    process.env.API_KEY = "server-secret-123";
    const env = createEnv({
      API_KEY: "API_KEY",
    });
    expect(env.get("API_KEY")).toBe("server-secret-123");
  });

  it("reads from window.__NEXTENV on client", () => {
    (globalThis as any).window = {
      __NEXTENV: {
        API_KEY: "client-key-456",
      },
    };

    const env = createEnv({
      API_KEY: "API_KEY",
    });
    expect(env.get("API_KEY")).toBe("client-key-456");
  });

  it("non-allowlisted vars return undefined (even during SSR)", () => {
    process.env.SECRET_DB_PASSWORD = "super-secret-pw";
    process.env.PUBLIC_VAR = "public-val";

    const env = createEnv({
      PUBLIC_VAR: "PUBLIC_VAR",
    });

    expect((env.get as any)("SECRET_DB_PASSWORD")).toBeUndefined();
  });

  it("default values applied when env var missing", () => {
    const env = createEnv({
      APP_MODE: { env: "APP_MODE", default: "development" },
    });
    expect(env.get("APP_MODE")).toBe("development");
  });

  it("default values NOT overridden when env var exists", () => {
    process.env.APP_MODE = "production";
    const env = createEnv({
      APP_MODE: { env: "APP_MODE", default: "development" },
    });
    expect(env.get("APP_MODE")).toBe("production");
  });

  it("validate() throws on missing required var", () => {
    // biome-ignore lint/performance/noDelete: Delete process.env var to test missing requirement
    delete process.env.REQUIRED_VAR;
    const env = createEnv({
      REQUIRED_VAR: "REQUIRED_VAR",
    });
    expect(() => env.validate()).toThrowError(/Missing "REQUIRED_VAR"/);
  });

  it("validate() passes with default value present", () => {
    const env = createEnv({
      FEATURE_FLAG: { env: "FEATURE_FLAG", default: "enabled" },
    });
    expect(() => env.validate()).not.toThrow();
  });

  it("Standard Schema validation works (mock ~standard interface)", () => {
    process.env.PORT = "invalid-number";
    const env = createEnv({
      PORT: {
        env: "PORT",
        schema: {
          "~standard": {
            validate: (val: unknown) => {
              if (val !== "8080") {
                return { issues: [{ message: "Port must be 8080" }] };
              }
              return { value: val };
            },
          },
        },
      },
    });

    expect(() => env.validate()).toThrowError(/Validation failed for "PORT"/);
  });

  it("rejects async Standard Schema validators", () => {
    process.env.PORT = "8080";
    const env = createEnv({
      PORT: {
        env: "PORT",
        schema: {
          "~standard": {
            validate: (_val: unknown) => Promise.resolve({ value: _val }),
          },
        },
      },
    });

    expect(() => env.validate()).toThrowError(/Async schema validation/);
  });

  it("no-schema mode works (just strings)", () => {
    process.env.FOO = "bar";
    const env = createEnv({
      FOO: "FOO",
    });
    expect(env.get("FOO")).toBe("bar");
    expect(() => env.validate()).not.toThrow();
  });

  it("custom var name mapping works (key != env var name)", () => {
    process.env.NEXT_PUBLIC_MAP_KEY = "map-123";
    const env = createEnv({
      googleMapApiKey: { env: "NEXT_PUBLIC_MAP_KEY" },
    });
    expect(env.get("googleMapApiKey")).toBe("map-123");
  });
});
