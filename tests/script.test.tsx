import React from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EnvScript } from "../src/script.js";

describe("EnvScript Component", () => {
  it("renders script tag with correct content", () => {
    const mockEnv = {
      __serialize: () => JSON.stringify({ API_KEY: "12345" }),
    };

    const html = renderToString(<EnvScript env={mockEnv} />);
    expect(html).toContain('window.__NEXTENV={"API_KEY":"12345"}');
    expect(html).toContain("<script");
  });

  it("includes nonce and suppressHydrationWarning prop", () => {
    const mockEnv = {
      __serialize: () => JSON.stringify({ API_KEY: "12345" }),
    };

    const scriptElement = EnvScript({ env: mockEnv, nonce: "my-secret-nonce" });
    expect(scriptElement.props.nonce).toBe("my-secret-nonce");
    expect(scriptElement.props.suppressHydrationWarning).toBe(true);

    const html = renderToString(
      <EnvScript env={mockEnv} nonce="my-secret-nonce" />,
    );
    expect(html).toContain('nonce="my-secret-nonce"');
  });
});
