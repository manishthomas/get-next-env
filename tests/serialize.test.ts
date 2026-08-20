import { describe, expect, it } from "vitest";
import { safeSerialize } from "../src/serialize.js";

describe("safeSerialize", () => {
  it("escapes </script> tag breakout", () => {
    const input = { key: "</script><script>alert(1)</script>" };
    const serialized = safeSerialize(input);
    expect(serialized).not.toContain("</script>");
    expect(serialized).toContain("\\u003c/script\\u003e");
  });

  it("escapes unicode line separators U+2028 and U+2029", () => {
    const input = { line: "hello\u2028world\u2029" };
    const serialized = safeSerialize(input);
    expect(serialized).toContain("\\u2028");
    expect(serialized).toContain("\\u2029");
  });
});
