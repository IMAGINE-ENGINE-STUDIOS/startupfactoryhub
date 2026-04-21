import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const BUILD_VERSION = (import.meta.env.VITE_BUILD_ID as string | undefined) || 'sfh-build-v4';
const BUILD_VERSION_KEY = 'sfh_build_version';
const BUILD_RELOAD_GUARD = 'sfh_build_reload_guard';
const ASSET_RECOVERY_KEY = 'sfh_asset_recovery_once';

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

  // Only reload if there was a previously stored (different) version — avoids reload on first ever visit
  if (storedVersion !== null) {
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

async function recoverFromAssetFailure() {
  if (hasRecoveredFromAssetFailure()) return;

  markAssetRecoveryDone();
  removeLocalStorageItem(BUILD_VERSION_KEY);

  await unregisterServiceWorkersAndClearCaches();
  window.location.reload();
}

function installRuntimeRecoveryHandlers() {
  if (typeof window === 'undefined') return;

  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    void recoverFromAssetFailure();
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = typeof reason === 'string' ? reason : reason?.message ?? '';

    if (!/Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(message)) {
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
  void invalidateOnNewBuild();
}

bootstrap();
