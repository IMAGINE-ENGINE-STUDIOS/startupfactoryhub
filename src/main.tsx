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

declare const __APP_BUILD_ID__: string;

const BUILD_VERSION = (import.meta.env.VITE_BUILD_ID as string | undefined) || __APP_BUILD_ID__;
const BUILD_VERSION_KEY = 'sfh_build_version';
const BUILD_RELOAD_GUARD = 'sfh_build_reload_guard';
const ASSET_RECOVERY_KEY = 'sfh_asset_recovery_once';
const DEV_PREVIEW_CACHE_RESET_KEY = 'sfh_dev_preview_cache_reset_once';
const ASSET_FAILURE_PATTERN = /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Failed to load module script|Load failed/i;

function reloadIntoFreshBuild() {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  url.searchParams.set('_build', BUILD_VERSION);
  window.location.replace(url.toString());
}

function getLocalStorageItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function setLocalStorageItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors
  }
}

function removeLocalStorageItem(key: string) {
  try {
    localStorage.removeItem(key);
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

async function invalidateOnNewBuild() {
  if (typeof window === 'undefined') return;
  // Dev/preview builds regenerate the build id on every server restart, which
  // would trigger an endless clear-cache + location.replace loop inside the
  // preview iframe. Only run the cache-busting reload in production builds.
  if (!import.meta.env.PROD) return;

  const storedVersion = getLocalStorageItem(BUILD_VERSION_KEY);
  if (storedVersion === BUILD_VERSION) return;


  // Guard against reload loops within a single session
  if (getSessionStorageItem(BUILD_RELOAD_GUARD) === BUILD_VERSION) {
    setLocalStorageItem(BUILD_VERSION_KEY, BUILD_VERSION);
    return;
  }

  await unregisterServiceWorkersAndClearCaches();
  setLocalStorageItem(BUILD_VERSION_KEY, BUILD_VERSION);
  setSessionStorageItem(BUILD_RELOAD_GUARD, BUILD_VERSION);
  reloadIntoFreshBuild();
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
    window.location.reload();
  }
}

function hasRecoveredFromAssetFailure() {
  try {
    return sessionStorage.getItem(ASSET_RECOVERY_KEY) === 'done';
  } catch {
    return false;
  }
}

function markAssetRecoveryDone() {
  try {
    sessionStorage.setItem(ASSET_RECOVERY_KEY, 'done');
  } catch {
    // Ignore storage errors
  }
}

function getErrorMessage(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.message;
  if (value && typeof value === 'object' && 'message' in value) {
    return String((value as { message?: unknown }).message ?? '');
  }

  return '';
}

async function recoverFromAssetFailure() {
  if (hasRecoveredFromAssetFailure()) return;

  markAssetRecoveryDone();
  removeLocalStorageItem(BUILD_VERSION_KEY);

  await unregisterServiceWorkersAndClearCaches();
  reloadIntoFreshBuild();
}

function installRuntimeRecoveryHandlers() {
  if (typeof window === 'undefined') return;

  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    void recoverFromAssetFailure();
  });

  window.addEventListener('unhandledrejection', (event) => {
    const message = getErrorMessage(event.reason);

    if (!ASSET_FAILURE_PATTERN.test(message)) {
      return;
    }

    event.preventDefault();
    void recoverFromAssetFailure();
  });

  window.addEventListener('error', (event) => {
    const message = `${event.message} ${getErrorMessage(event.error)}`;

    if (!ASSET_FAILURE_PATTERN.test(message)) {
      return;
    }

    event.preventDefault();
    void recoverFromAssetFailure();
  });
}

function bootstrap() {
  installRuntimeRecoveryHandlers();

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  createRoot(rootElement).render(<App />);
  void clearDevPreviewCaches();
  void invalidateOnNewBuild();
}

bootstrap();
