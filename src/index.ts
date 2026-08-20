import { safeSerialize } from "./serialize.js";
export { EnvScript } from "./script.js";
export type { EnvScriptProps } from "./script.js";

declare global {
  interface Window {
    __NEXTENV?: Record<string, unknown>;
  }
}

export type EnvSchemaSpec<T = unknown> =
  | string
  | {
      env: string;
      default?: T;
      schema?: {
        "~standard"?: {
          validate: (value: unknown) =>
            | { value?: unknown; issues?: ReadonlyArray<{ message: string }> }
            | Promise<{
                value?: unknown;
                issues?: ReadonlyArray<{ message: string }>;
              }>;
        };
        safeParse?: (val: unknown) => {
          success: boolean;
          error?: any;
          data?: any;
        };
        parse?: (val: unknown) => any;
      };
    };

export type EnvConfig = Record<string, EnvSchemaSpec>;

export type InferEnv<T extends EnvConfig> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends { default: infer D }
      ? D
      : T[K] extends { schema: any }
        ? any
        : string;
};

export interface EnvInstance<T extends EnvConfig> {
  get<K extends keyof T>(key: K): InferEnv<T>[K];
  validate(): void;
  __serialize(): string;
  __reset(): void;
}

export function createEnv<T extends EnvConfig>(config: T): EnvInstance<T> {
  let cache: Record<string, unknown> | null = null;

  function getCache(): Record<string, unknown> {
    if (cache) return cache;
    const isServer = typeof window === "undefined";
    const clientEnv = !isServer ? window.__NEXTENV || {} : {};
    const newCache: Record<string, unknown> = Object.create(null);

    for (const key of Object.keys(config)) {
      const spec = config[key];
      const envKey = typeof spec === "string" ? spec : spec.env;
      const defaultValue = typeof spec === "object" ? spec.default : undefined;
      const rawValue = isServer ? process.env[envKey] : clientEnv[key];
      newCache[key] = rawValue !== undefined ? rawValue : defaultValue;
    }

    cache = newCache;
    return cache;
  }

  return {
    get<K extends keyof T>(key: K): InferEnv<T>[K] {
      return getCache()[key as string] as InferEnv<T>[K];
    },

    validate() {
      const curCache = getCache();
      for (const key of Object.keys(config)) {
        const spec = config[key];
        const envKey = typeof spec === "string" ? spec : spec.env;
        const val = curCache[key];

        if (val === undefined) {
          throw new Error(
            `[get-next-env] Missing "${String(key)}" (process.env.${envKey})`,
          );
        }

        if (typeof spec === "object" && spec.schema) {
          const schema = spec.schema as any;
          const std = schema["~standard"];
          if (std && typeof std.validate === "function") {
            const res = std.validate(val);
            if (res instanceof Promise) {
              throw new Error(
                "[get-next-env] Async schema validation is not supported",
              );
            }
            if (res?.issues?.length) {
              const msg = res.issues.map((i: any) => i.message).join(", ");
              throw new Error(
                `[get-next-env] Validation failed for "${String(key)}": ${msg}`,
              );
            }
          } else if (typeof schema.safeParse === "function") {
            const res = schema.safeParse(val);
            if (!res.success) {
              const msg = res.error?.issues
                ? res.error.issues.map((i: any) => i.message).join(", ")
                : String(res.error);
              throw new Error(
                `[get-next-env] Validation failed for "${String(key)}": ${msg}`,
              );
            }
          } else if (typeof schema.parse === "function") {
            try {
              schema.parse(val);
            } catch (err: any) {
              throw new Error(
                `[get-next-env] Validation failed for "${String(key)}": ${err.message || String(err)}`,
              );
            }
          }
        }
      }
    },

    __serialize(): string {
      return safeSerialize(getCache());
    },

    /** @internal */
    __reset() {
      cache = null;
    },
  };
}
