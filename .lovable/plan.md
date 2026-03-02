

## Plan: Set Up Capacitor for Native Android & iOS Apps

Since you want real native apps for both Android and Apple, we'll use **Capacitor** — it wraps your existing web app into a native shell that can be published to the App Store and Google Play.

### What will be done

1. **Install Capacitor dependencies**: `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`

2. **Create `capacitor.config.ts`** in the project root with:
   - `appId`: `app.lovable.ea8832c05f304d47a6119a3021cb2360`
   - `appName`: `startupfactoryhub`
   - `webDir`: `dist`
   - Hot-reload server pointing to your preview URL for development

### What you'll need to do on your end (after I set it up)

1. Export the project to GitHub via "Export to GitHub" button, then clone it locally
2. Run `npm install`
3. Run `npx cap add ios` and/or `npx cap add android`
4. Run `npx cap update ios` / `npx cap update android`
5. Run `npm run build`
6. Run `npx cap sync`
7. Run `npx cap run android` (requires Android Studio) or `npx cap run ios` (requires Mac + Xcode)

After any future code changes, just `git pull` → `npm run build` → `npx cap sync` → run again.

For more details, check out the [Lovable mobile development guide](https://docs.lovable.dev).

