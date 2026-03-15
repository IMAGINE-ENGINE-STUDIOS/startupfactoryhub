import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const SW_RESET_KEY = 'sfh_sw_reset_v3';
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

async function resetStaleServiceWorkersOnce() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  if (getLocalStorageItem(SW_RESET_KEY) === 'done') return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));

    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key)));
    }

    setLocalStorageItem(SW_RESET_KEY, 'done');
  } catch (error) {
    console.error('Service worker reset failed:', error);
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
  removeLocalStorageItem(SW_RESET_KEY);

  await resetStaleServiceWorkersOnce();
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
  void resetStaleServiceWorkersOnce();
}

bootstrap();
