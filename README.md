# Gentle

A free, anonymity-first connection app for people who are struggling, to find platonic and emotional support.

## Structure

- `server/` — Express + SQLite (better-sqlite3) + Socket.IO backend
- `client/` — React + Vite PWA frontend
- `client/android/` — native Android project (Capacitor), generated from `client/`, for building an installable APK
- `reference/gentle-app.html` — original design mockup (source of truth for visual language)

## Running locally

```bash
# Backend
cd server
cp .env.example .env   # add an OPENAI_API_KEY to enable real moderation
npm install
npm run dev             # http://localhost:4000

# Frontend (separate terminal)
cd client
cp .env.example .env
npm install
npm run dev             # http://localhost:5173, proxies /api and /socket.io to :4000
```

Trigger the daily matching job manually for MVP testing:

```bash
curl -X POST http://localhost:4000/api/matching/run
```

Admin moderation queue (basic auth, credentials from `server/.env`):

```
http://localhost:4000/admin/reports
```

## Building the Android APK

The frontend is wrapped with [Capacitor](https://capacitorjs.com) so it can also ship as a native Android app, using `@capacitor/preferences` in place of `localStorage` on-device (see `client/src/lib/storage.js`).

The native project has no page origin to resolve relative API/socket calls against, so it needs an absolute backend URL baked in at build time:

```bash
cd client
cp .env.example .env
# edit .env: set VITE_API_BASE_URL to your deployed backend's URL (e.g. https://api.gentle.example.com)
npm install
npx vite build
npx cap sync android
```

Then either:

- Open `client/android` in Android Studio and run/build from there, or
- Build a debug APK from the command line:

  ```bash
  cd client/android
  ./gradlew assembleDebug
  # output: client/android/app/build/outputs/apk/debug/app-debug.apk
  ```

A release build additionally requires a signing keystore — see Android's [app signing docs](https://developer.android.com/studio/publish/app-signing).

This repo only contains the Capacitor scaffolding and synced web assets; producing an actual `.apk` requires the Android SDK and Gradle, which must run on a machine (or CI) with the SDK installed.

### Building via GitHub Actions

`.github/workflows/android-apk.yml` builds the debug APK in CI (Ubuntu runner with the Android SDK already installed) and uploads it as a workflow artifact. It runs on pushes to `main` that touch `client/**`, or manually via the Actions tab ("Run workflow").

Before running it, add a repository secret `VITE_API_BASE_URL` set to your deployed backend's URL — without it the native app has no origin to call the API/socket against. After a run finishes, download `gentle-debug-apk` from the workflow run's Artifacts section.

## Notes

- Auth is device-token based: no email or password is collected. The device token is stored via the storage wrapper in `client/src/lib/storage.js`, which can be swapped for `@capacitor/preferences` when wrapping with Capacitor.
- Chat messages are ephemeral (short TTL) until both participants tap "connect" on a mutual match, at which point the chat becomes permanent. Either party can additionally choose to reveal their name/photo independently of connecting.
- Every outgoing message is checked against the OpenAI moderation endpoint before delivery; without an `OPENAI_API_KEY` configured, moderation is a no-op pass-through for local development.
- A future optional subscription tier could hook into `server/src/routes.js` without touching the free core flows (matching, chat, safety bar) — none of those routes are gated.
