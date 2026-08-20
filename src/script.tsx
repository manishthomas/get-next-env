import React from "react";

export interface EnvScriptProps {
  env: {
    __serialize: () => string;
  };
  nonce?: string;
}

export function EnvScript({ env, nonce }: EnvScriptProps) {
  return (
    <script
      suppressHydrationWarning
      nonce={nonce}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: safeSerialize is used to escape HTML breakout characters
      dangerouslySetInnerHTML={{
        __html: `window.__NEXTENV=${env.__serialize()}`,
      }}
    />
  );
}
