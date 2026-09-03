/**
 * NET is a professional directory, so placeholder and unfinished identities
 * must never be surfaced in search, suggestions, connections or matching.
 */
const BLOCKED_NAME_PATTERNS = [
  /\bmy accelerator\b/i,
  /\bdemo user\b/i,
  /\bdemo account\b/i,
  /\btest user\b/i,
];

type VisibleProfile = {
  full_name?: string | null;
  bio?: string | null;
};

export function isVisibleCommunityProfile(profile: VisibleProfile): boolean {
  const name = profile.full_name?.trim() || '';
  const bio = profile.bio?.trim() || '';
  if (name.length < 2 || bio.length < 10) return false;
  return !BLOCKED_NAME_PATTERNS.some((pattern) => pattern.test(name));
}

export function isVisibleCommunityName(name?: string | null): boolean {
  const normalized = name?.trim() || '';
  if (normalized.length < 2) return false;
  return !BLOCKED_NAME_PATTERNS.some((pattern) => pattern.test(normalized));
}