

## Plan: Set Up PWA (Progressive Web App) for Installable Mobile Experience

The app is now configured as a PWA so users can install it directly from the website on both Android and iOS devices.

### What was done

1. **Removed Capacitor** dependencies and config
2. **Installed `vite-plugin-pwa`** and configured in `vite.config.ts` with manifest, service worker, and caching
3. **Added mobile meta tags** to `index.html` (apple-mobile-web-app-capable, touch icon, etc.)
4. **Generated PWA icons** (192x192 and 512x512) in `/public`
5. **Created `/install` page** with platform-specific instructions for iOS, Android, and Desktop
6. **Added route** `/install` to the app router

### How users install the app

- **Android (Chrome)**: Visit the site → browser shows "Install" banner, or visit `/install`
- **iOS (Safari)**: Visit `/install` → follow "Share → Add to Home Screen" instructions
- **Desktop (Chrome/Edge)**: Click install icon in address bar
