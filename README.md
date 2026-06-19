# Gentle

A free, anonymity-first connection app for people who are struggling, to find platonic and emotional support.

## Structure

- `server/` — Express + SQLite (better-sqlite3) + Socket.IO backend
- `client/` — React + Vite PWA frontend
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

## Notes

- Auth is device-token based: no email or password is collected. The device token is stored via the storage wrapper in `client/src/lib/storage.js`, which can be swapped for `@capacitor/preferences` when wrapping with Capacitor.
- Chat messages are ephemeral (short TTL) until both participants tap "connect" on a mutual match, at which point the chat becomes permanent. Either party can additionally choose to reveal their name/photo independently of connecting.
- Every outgoing message is checked against the OpenAI moderation endpoint before delivery; without an `OPENAI_API_KEY` configured, moderation is a no-op pass-through for local development.
- A future optional subscription tier could hook into `server/src/routes.js` without touching the free core flows (matching, chat, safety bar) — none of those routes are gated.
