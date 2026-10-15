/**
 * Pitch deck link helpers — normalizes uploaded and external deck links.
 * Credits: Imagine Engine Studios Corp.
 */
export function normalizeDeckUrl(raw?: string | null): string | null {
  const v = (raw || '').trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith('//')) return `https:${v}`;
  return `https://${v.replace(/^\/+/, '')}`;
}

export function openDeckUrl(raw?: string | null) {
  const url = normalizeDeckUrl(raw);
  if (url) window.open(url, '_blank', 'noopener,noreferrer');
}
