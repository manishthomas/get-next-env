# get-next-env

[![npm version](https://img.shields.io/npm/v/get-next-env.svg?style=flat-square)](https://www.npmjs.com/package/get-next-env)
[![bundle size](https://img.shields.io/bundlephobia/minzip/get-next-env?style=flat-square)](https://bundlephobia.com/package/get-next-env)
[![CI Status](https://github.com/manishthomas/get-next-env/actions/workflows/ci.yml/badge.svg)](https://github.com/manishthomas/get-next-env/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/get-next-env.svg?style=flat-square)](https://github.com/manishthomas/get-next-env/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/get-next-env.svg?style=flat-square)](https://www.npmjs.com/package/get-next-env)

Type-safe runtime environment variables for Next.js. Build once, deploy everywhere.

---

## The Problem

Next.js inlines environment variables (like `NEXT_PUBLIC_*`) at build time into client JavaScript bundles. This breaks the standard "build once, deploy many" pattern required for containerized applications in Docker or Kubernetes, forcing you to rebuild the container for every environment (dev, staging, prod). Existing workarounds often risk leaking server secrets during SSR or break React 19 / CSP nonces.

## The Solution

`get-next-env` injects filtered environment variables at **request time** directly into page HTML. One Docker image artifact can be built once and deployed across all environments safely and seamlessly.

```typescript
import { createEnv } from 'get-next-env';

export const env = createEnv({
  GOOGLEMAP_API_KEY: 'GOOGLEMAP_API_KEY',
  ENVIRONMENT: { env: 'NEXT_PUBLIC_ENVIRONMENT', default: 'local' },
});
```

---

## Installation

```bash
npm install get-next-env
# or
pnpm add get-next-env
# or
yarn add get-next-env
```

---

## Usage

### 1. App Router (`app/layout.tsx`)

Inside `<head>`:

```tsx
import { EnvScript } from 'get-next-env';
import { env } from '../env.config';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <EnvScript env={env} />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 2. Pages Router (`pages/_document.tsx`)

Inside `<Head>`:

```tsx
import { Head, Html, Main, NextScript } from 'next/document';
import { EnvScript } from 'get-next-env';
import { env } from '../env.config';

export default function Document() {
  return (
    <Html>
      <Head>
        <EnvScript env={env} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

### 3. Usage Modes

#### Mode 1: Without Validator (Zero Dependencies)

```typescript
import { createEnv } from 'get-next-env';

export const env = createEnv({
  GOOGLEMAP_API_KEY: 'GOOGLEMAP_API_KEY',
  ENVIRONMENT: { env: 'NEXT_PUBLIC_ENVIRONMENT', default: 'local' },
});
```

#### Mode 2: With Zod (Standard Schema)

```typescript
import { createEnv } from 'get-next-env';
import { z } from 'zod';

export const env = createEnv({
  GOOGLEMAP_API_KEY: { env: 'GOOGLEMAP_API_KEY', schema: z.string().startsWith('AIza') },
  ENVIRONMENT: { env: 'NEXT_PUBLIC_ENVIRONMENT', schema: z.enum(['local', 'dev', 'staging', 'prod']), default: 'local' },
});
```

#### Mode 3: With Valibot or Standard Schema Compliant Validator

```typescript
import { createEnv } from 'get-next-env';
import * as v from 'valibot';

export const env = createEnv({
  GOOGLEMAP_API_KEY: { env: 'GOOGLEMAP_API_KEY', schema: v.pipe(v.string(), v.startsWith('AIza')) },
});
```

### Accessing Variables Anywhere

```typescript
import { env } from '../env.config';

const apiKey = env.get('GOOGLEMAP_API_KEY');
```

### Startup Validation (Optional)

Call `validate()` during application initialization or server startup to ensure required variables are present:

```typescript
env.validate();
// Throws: [nextenv] Missing "GOOGLEMAP_API_KEY" (process.env.GOOGLEMAP_API_KEY)
```

---

## API Reference

### `createEnv(config)`
Factory function to define allowed environment variables.
* **Returns**: Object with `.get(key)`, `.validate()`, and `.__serialize()`.

### `<EnvScript env={env} nonce={nonce} />`
React component that injects `window.__NEXTENV` into the page HTML via a plain `<script>` element.
* **Props**:
  * `env`: Instance returned by `createEnv`.
  * `nonce` *(optional)*: Content Security Policy (CSP) nonce string.

### `env.validate()`
Validates that required environment variables exist and conform to their schemas.

---

## Security Model

1. **Strict Allowlist Filtering**: `.get()` never reads raw `process.env` dynamically; it only accesses the pre-built allowlist cache.
2. **SSR Secret Leak Prevention**: During SSR, non-allowlisted server secrets in `process.env` are never accessible or serialized.
3. **XSS Protection**: `safeSerialize` encodes HTML breakout sequences (`<`, `>`, `&`) and Unicode line separators (`\u2028`, `\u2029`).
4. **Prototype Pollution Protection**: Internal cache is instantiated using `Object.create(null)`.
5. **CSP Nonce Support**: Compatible with custom CSP nonces and includes `suppressHydrationWarning`.

---

## Why Not Alternatives?

| Feature | get-next-env | next-runtime-env | @t3-oss/env-nextjs | next-public-env |
| --- | --- | --- | --- | --- |
| Runtime injection | ✅ | ✅ | ❌ (build-time) | ✅ |
| Pages Router | ✅ | ❌ (dropped) | ✅ | ❌ |
| App Router | ✅ | ✅ | ✅ | ✅ |
| Standalone output | ✅ | ❌ | N/A | Unknown |
| SSR leak prevention | ✅ | ❌ | N/A | ❌ |
| CSP nonce (no hydration error) | ✅ | ❌ | N/A | ❌ |
| Next.js 16 / React 19 | ✅ | ❌ | ✅ | ❌ |
| Validator-agnostic | ✅ (Standard Schema) | N/A | ❌ (Zod only→Standard Schema) | ❌ (Zod required) |
| Works without validator | ✅ | ✅ | ❌ | ❌ |
| Zero dependencies | ✅ | ✅ | ❌ | ❌ (Zod) |
| Client bundle size | <300 bytes | ~5KB | ~2KB | ~275 bytes |

---

## Edge Runtime

Edge Runtime support has not been fully verified. Please open an issue on [GitHub](https://github.com/manishthomas/get-next-env/issues) if you need Edge Runtime support or encounter issues.

---

## Contributing

Contributions are welcome! Please check out [CONTRIBUTING.md](https://github.com/manishthomas/get-next-env/blob/main/CONTRIBUTING.md) to get started.

---

## License

[MIT](https://github.com/manishthomas/get-next-env/blob/main/LICENSE) © Manish Thomas
