/**
 * Runtime polyfills for older browsers (Safari < 15.4, insecure contexts, in-app webviews).
 * Must be imported before any app code that touches crypto.randomUUID.
 */
(() => {
  if (typeof globalThis === 'undefined') return;

  const g = globalThis as unknown as { crypto?: Crypto };

  if (!g.crypto) {
    // Extremely old environments: provide a minimal object.
    try {
      (g as { crypto?: unknown }).crypto = {} as Crypto;
    } catch {
      return;
    }
  }

  const c = g.crypto as Crypto & { randomUUID?: () => string };

  const getRandomValues = (arr: Uint8Array): Uint8Array => {
    const fn = (c as { getRandomValues?: (a: Uint8Array) => Uint8Array }).getRandomValues;
    if (typeof fn === 'function') {
      return fn.call(c, arr);
    }
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  };

  if (typeof c.randomUUID !== 'function') {
    try {
      Object.defineProperty(c, 'randomUUID', {
        configurable: true,
        writable: true,
        value: () => {
          const bytes = getRandomValues(new Uint8Array(16));
          // RFC 4122 version 4
          bytes[6] = (bytes[6] & 0x0f) | 0x40;
          bytes[8] = (bytes[8] & 0x3f) | 0x80;
          const hex: string[] = [];
          for (let i = 0; i < 16; i++) hex.push(bytes[i].toString(16).padStart(2, '0'));
          return (
            hex.slice(0, 4).join('') +
            '-' +
            hex.slice(4, 6).join('') +
            '-' +
            hex.slice(6, 8).join('') +
            '-' +
            hex.slice(8, 10).join('') +
            '-' +
            hex.slice(10, 16).join('')
          ) as string;
        },
      });
    } catch {
      /* ignore — read-only crypto object */
    }
  }
})();

export {};
