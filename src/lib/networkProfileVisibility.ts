/**
 * NET shows every real member. Only placeholder/demo identities are hidden,
 * so the community counts match the actual user base.
 */
const BLOCKED_NAME_PATTERNS = [
  /\bmy accelerator\b/i,
  /\bdemo\b/i,
  /\bdemo user\b/i,
  /\bdemo account\b/i,
  /\btest user\b/i,
];

type VisibleProfile = {
  full_name?: string | null;
  bio?: string | null;
};

export function isVisibleCommunityProfile(profile: VisibleProfile): boolean {
  return isVisibleCommunityName(profile.full_name);
}

export function isVisibleCommunityName(name?: string | null): boolean {
  const normalized = name?.trim() || '';
  if (!normalized) return true; // unnamed real accounts stay counted
  return !BLOCKED_NAME_PATTERNS.some((pattern) => pattern.test(normalized));
}
