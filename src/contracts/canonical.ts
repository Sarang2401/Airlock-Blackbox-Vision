/**
 * Deterministic canonical JSON and SHA-256 hashing.
 * Sorts object keys recursively to ensure bitwise matching across sessions.
 */

export function canonicalJsonStringify(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    if (typeof obj === 'number') {
      if (!Number.isFinite(obj)) {
        throw new Error('NaN or Infinity not allowed in canonical JSON');
      }
      return Object.is(obj, -0) ? '0' : String(obj);
    }
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    const items = obj.map(canonicalJsonStringify);
    return `[${items.join(',')}]`;
  }

  const record = obj as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  const pairs = keys
    .filter((k) => record[k] !== undefined)
    .map((k) => `${JSON.stringify(k)}:${canonicalJsonStringify(record[k])}`);
  return `{${pairs.join(',')}}`;
}

export async function sha256Hex(content: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(content);
  
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  throw new Error('Web Cryptography API (crypto.subtle) is required for SHA-256');
}
