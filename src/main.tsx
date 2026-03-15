import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const SW_RESET_KEY = 'sfh_sw_reset_v3';
const ASSET_RECOVERY_KEY = 'sfh_asset_recovery_once';

async function resetStaleServiceWorkersOnce() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  if (localStorage.getItem(SW_RESET_KEY) === 'done') return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));

    if ('caches' in window) {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map((key) => caches.delete(key)));
    }

    localStorage.setItem(SW_RESET_KEY, 'done');
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

  try {
    localStorage.removeItem(SW_RESET_KEY);
  } catch {
    // Ignore storage errors
  }

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

async function bootstrap() {
  installRuntimeRecoveryHandlers();
  await resetStaleServiceWorkersOnce();
  createRoot(document.getElementById('root')!).render(<App />);
}

void bootstrap();
