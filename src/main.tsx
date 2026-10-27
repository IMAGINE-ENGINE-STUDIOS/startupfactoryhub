import './lib/polyfills';
import { createRoot } from 'react-dom/client';
import '@fontsource/sora/300.css';
import '@fontsource/sora/400.css';
import '@fontsource/sora/500.css';
import '@fontsource/sora/600.css';
import '@fontsource/manrope/300.css';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/plus-jakarta-sans/300.css';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
import '@fontsource/playfair-display/700.css';
import '@fontsource/playfair-display/700-italic.css';
import App from './App.tsx';
import './index.css';
import { saveRestorePoint, applyRestorePoint } from './lib/sessionRestore';
import { installAutoDebugger } from './lib/autoDebugger';

/** Extract a readable message from any thrown value. */
const getErrorMessage = (err: unknown): string => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try { return JSON.stringify(err) ?? ''; } catch { return String(err); }
};
import { notifyUpdateAvailable } from './lib/updateSignal';

// Intercept async faults (stale chunks, layout noise) before they reach the user.
installAutoDebugger();

declare const __APP_BUILD_ID__: string;

const BUILD_VERSION = (import.meta.env.VITE_BUILD_ID as string | undefined) || __APP_BUILD_ID__;
const BUILD_VERSION_KEY = 'sfh_build_version';
const DEV_PREVIEW_CACHE_RESET_KEY = 'sfh_dev_preview_cache_reset_once';
// Narrow on purpose: generic network messages like Safari's "Load failed" are
// NOT included, since a single flaky API call must never reload the whole app.
const ASSET_FAILURE_PATTERN = /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Failed to load module script/i;

function setLocalStorageItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors
  }
}

function getSessionStorageItem(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function setSessionStorageItem(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Ignore storage errors
  }
}

async function unregisterServiceWorkersAndClearCaches() {
  if (typeof window === 'undefined') return;

  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key)));
    }
  } catch (error) {
    console.error('Cache/service worker reset failed:', error);
  }
}

function noteBuildVersion() {
  if (typeof window === 'undefined') return;
  // NO-RELOAD RULE (founder directive 2026-10-26): the site never
  // reloads itself. This used to clear caches and force a reload
  // whenever the booted build differed from the stored one — a
  // surprise reload on the user's first visit after every deploy.
  // Now it only records the version: the build that booted IS the
  // current build, and open tabs learn about newer builds from the
  // UpdateAvailableBubble, which waits for the user's click.
  if (!import.meta.env.PROD) return;
  setLocalStorageItem(BUILD_VERSION_KEY, BUILD_VERSION);
}

async function clearDevPreviewCaches() {
  if (typeof window === 'undefined') return;
  if (!import.meta.env.DEV) return;
  if (getSessionStorageItem(DEV_PREVIEW_CACHE_RESET_KEY) === 'done') return;

  const hadActiveServiceWorker = Boolean(navigator.serviceWorker?.controller);
  await unregisterServiceWorkersAndClearCaches();
  setSessionStorageItem(DEV_PREVIEW_CACHE_RESET_KEY, 'done');

  // If an old PWA service worker controlled this preview load, the current page
  // may already have been served from a stale cache. Reload once after cleanup.
  if (hadActiveServiceWorker) {
    saveRestorePoint();
    window.location.reload();
  }
}

function installRuntimeRecoveryHandlers() {
  if (typeof window === 'undefined') return;

  // NO-RELOAD RULE (founder directive 2026-10-26): an asset failure
  // means a newer build replaced this tab's chunks. The old code
  // purged caches and reloaded the page on its own. Now the failure
  // is swallowed (no crash surfaces) and the update offer is raised —
  // the user clicks Refresh when ready and lands back in their exact
  // place. Nothing ever reloads itself.
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    notifyUpdateAvailable();
  });

  window.addEventListener('unhandledrejection', (event) => {
    const message = getErrorMessage(event.reason);

    if (!ASSET_FAILURE_PATTERN.test(message)) {
      return;
    }

    event.preventDefault();
    notifyUpdateAvailable();
  });

  window.addEventListener('error', (event) => {
    const message = `${event.message} ${getErrorMessage(event.error)}`;

    if (!ASSET_FAILURE_PATTERN.test(message)) {
      return;
    }

    event.preventDefault();
    notifyUpdateAvailable();
  });
}

function bootstrap() {
  installRuntimeRecoveryHandlers();

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  import('@/lib/tabMemory').then((m) => m.sweepStaleCaches()).catch(() => {});
  createRoot(rootElement).render(<App />);
  // Put the user back at the exact pixels they were at before a reload/crash.
  applyRestorePoint();
  void clearDevPreviewCaches();
  noteBuildVersion();
}

bootstrap();
