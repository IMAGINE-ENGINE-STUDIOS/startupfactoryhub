// TRACKER — App changelog feed.
// Add a new entry at the top whenever the app gets a meaningful update.
// The Tracker compares the latest version against what each user has seen
// and triggers the Take-the-Tour with the new highlights.

export interface ChangelogEntry {
  version: string;            // semver-ish unique identifier
  date: string;               // ISO date
  title: string;              // short headline
  summary: string;            // 1-2 sentences for the tour modal
  highlights: string[];       // bullet list
  tourTab?: string;           // optional dashboard tab to land on
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.4.0",
    date: "2026-04-23",
    title: "Flow Investigations: ask anything, save everything",
    summary:
      "Every Flow analysis becomes a permanent investigation. Ask follow-up questions, take notes, and revisit months later.",
    highlights: [
      "New 'Investigate' tab — conversational deep-dive over your Bayesian model.",
      "New 'Notes' tab — write, pin and edit observations alongside each result.",
      "New 'History' tab — every investigation is recorded and searchable.",
      "Tracker auto-updates Take-the-Tour on every release.",
    ],
    tourTab: "tools",
  },
];

/** The latest released version of the app. */
export const APP_VERSION = CHANGELOG[0]?.version ?? "1.0.0";

const STORAGE_KEY = "sfh.tracker.lastSeenVersion";
const SUPPRESSED_KEY = "sfh.tracker.suppressed";

export function getLastSeenVersion(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setLastSeenVersion(v: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, v);
  } catch {
    /* ignore */
  }
}

export function isUpdatePromptSuppressed(): boolean {
  try {
    return localStorage.getItem(SUPPRESSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function suppressUpdatePrompt(suppress: boolean): void {
  try {
    if (suppress) localStorage.setItem(SUPPRESSED_KEY, "1");
    else localStorage.removeItem(SUPPRESSED_KEY);
  } catch {
    /* ignore */
  }
}

/** Returns entries newer than the lastSeen version (inclusive of latest). */
export function getUnseenEntries(lastSeen: string | null): ChangelogEntry[] {
  if (!lastSeen) return CHANGELOG.slice(0, 1); // first visit: show only latest
  const idx = CHANGELOG.findIndex((e) => e.version === lastSeen);
  if (idx === -1) return CHANGELOG.slice(0, 1);
  return CHANGELOG.slice(0, idx);
}
