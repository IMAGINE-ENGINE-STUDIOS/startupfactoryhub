// Crash-safety draft persistence for LightPaper documents.
// Stores the current working snapshot in IndexedDB (via idb-keyval) so the
// document the user is editing survives reloads, tab crashes, and disconnects
// even before it has been saved as a project.
//
// Only one draft is kept at a time — when the user explicitly opens a project
// from the gallery we replace the draft so the most recent working file is
// always the one restored on next visit.

import { get, set, del } from "idb-keyval";

const DRAFT_KEY = "lightpaper:current-draft:v1";

export interface LightPaperDraft {
  // Identifier of the remote project the draft belongs to (if any).
  projectId: string | null;
  title: string;
  // Full content blob as returned by buildSaveContent(), including images.
  content: unknown;
  savedAt: number;
}

let writeTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleDraftSave(draft: LightPaperDraft, debounceMs = 300) {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    set(DRAFT_KEY, draft).catch((err) => {
      // QuotaExceeded etc. — retry once with images stripped so at least
      // titles / text content survive even if the giant base64 PDF doesn't.
      console.warn("[LightPaper draft] save failed, retrying compact:", err);
      try {
        const compact = {
          ...draft,
          content:
            typeof draft.content === "object" && draft.content
              ? { ...(draft.content as Record<string, unknown>), viewModeImages: [] }
              : draft.content,
        } as LightPaperDraft;
        set(DRAFT_KEY, compact).catch((e) =>
          console.error("[LightPaper draft] compact save also failed:", e),
        );
      } catch (e) {
        console.error("[LightPaper draft] compact build failed:", e);
      }
    });
  }, debounceMs);
}

export async function flushDraftNow(draft: LightPaperDraft) {
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = null;
  }
  try {
    await set(DRAFT_KEY, draft);
  } catch (err) {
    console.error("[LightPaper draft] flush failed:", err);
  }
}

export async function loadDraft(): Promise<LightPaperDraft | null> {
  try {
    const draft = (await get<LightPaperDraft>(DRAFT_KEY)) || null;
    return draft;
  } catch (err) {
    console.error("[LightPaper draft] load failed:", err);
    return null;
  }
}

export async function clearDraft() {
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = null;
  }
  try {
    await del(DRAFT_KEY);
  } catch (err) {
    console.error("[LightPaper draft] clear failed:", err);
  }
}
