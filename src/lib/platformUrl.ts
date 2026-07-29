/**
 * Canonical public base URL for Startup Factory Hub.
 * Shared links must always point to the platform domain, never to a
 * preview/sandbox host (e.g. *.lovable.app / *.lovableproject.com).
 */
export const PLATFORM_BASE_URL = "https://startupfactoryhub.com";

/** Returns the base URL to use when building a shareable link. */
export function getShareBaseUrl(): string {
  if (typeof window === "undefined") return PLATFORM_BASE_URL;
  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1" || host.endsWith(".local");
  if (isLocal) return window.location.origin;
  if (host === "startupfactoryhub.com" || host === "www.startupfactoryhub.com") {
    return window.location.origin;
  }
  return PLATFORM_BASE_URL;
}

/** Builds an absolute shareable link on the platform domain. */
export function buildShareUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getShareBaseUrl()}${normalized}`;
}

/** Shares via the native share sheet when available, otherwise copies to clipboard. */
export async function shareOrCopy(url: string, title?: string): Promise<"shared" | "copied"> {
  const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
  if (nav.share) {
    try {
      await nav.share({ title, url });
      return "shared";
    } catch {
      // user cancelled or share failed — fall through to clipboard
    }
  }
  await navigator.clipboard.writeText(url);
  return "copied";
}
