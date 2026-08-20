export function safeSerialize(obj: Record<string, unknown>): string {
  return JSON.stringify(obj)
    .replace(/[<>&]/g, (c) => `\\u00${c.charCodeAt(0).toString(16)}`)
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
