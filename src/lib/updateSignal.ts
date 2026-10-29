/**
 * Update-available signal (founder directive 2026-10-26): the site
 * NEVER reloads itself. When a newer build is detected — by the
 * version poll in UpdateAvailableBubble, by a dead lazy chunk, or by
 * the runtime recovery handlers — the signal raises a flag and the
 * bubble offers the update. The reload happens ONLY when the user
 * clicks Refresh, and only after their exact place (URL, scroll,
 * open panels, drafts) has been snapshotted for restore.
 */
import { saveRestorePoint } from "./sessionRestore";

const FLAG_KEY = "sfh.updateAvailable";
const EVENT_NAME = "sfh:update-available";

let available = false;
try {
  available = sessionStorage.getItem(FLAG_KEY) === "1";
} catch {
  /* storage unavailable */
}

export function isUpdateAvailable(): boolean {
  return available;
}

/** Raise the update offer. Idempotent — safe to call from every detector. */
export function notifyUpdateAvailable() {
  const was = available;
  available = true;
  try {
    sessionStorage.setItem(FLAG_KEY, "1");
  } catch {
    /* ignore */
  }
  if (!was && typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVENT_NAME));
  }
}

/**
 * Clear the update offer. Called when the user applies the update
 * (reloadForUpdate) and when the version poll confirms the running
 * build IS the latest served build. Without this the flag was
 * write-only: once raised it survived every refresh in
 * sessionStorage and the banner came straight back after each
 * reload — the "never satisfied" loop (founder report 2026-10-29).
 */
export function clearUpdateAvailable() {
  available = false;
  try {
    sessionStorage.removeItem(FLAG_KEY);
  } catch {
    /* ignore */
  }
}

export function subscribeUpdateAvailable(cb: () => void): () => void {
  const handler = () => cb();
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}

/**
 * The ONLY reload the app ever performs — always user-clicked.
 * Snapshots the user's exact place, clears stale caches and service
 * workers so the fresh build is served, then reloads. Restore points
 * and the office UI snapshot put everything back on the other side.
 */
export async function reloadForUpdate(): Promise<void> {
  // The user is applying the update — the offer must not survive
  // the reload, or the banner reappears on the fresh build.
  clearUpdateAvailable();
  saveRestorePoint();
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    const regs = (await navigator.serviceWorker?.getRegistrations?.()) ?? [];
    await Promise.all(regs.map((r) => r.unregister()));
  } catch {
    /* best effort — the reload itself is what matters */
  }
  window.location.reload();
}
