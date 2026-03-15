import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const SW_RESET_KEY = 'sfh_sw_reset_v2';

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

async function bootstrap() {
  await resetStaleServiceWorkersOnce();
  createRoot(document.getElementById('root')!).render(<App />);
}

void bootstrap();
