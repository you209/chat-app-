import { db } from './db.js';

// Expires unconnected ephemeral chats/matches 24h after a mutual wave with
// no connect, and purges chat messages past their TTL. Run on an interval.
export function runCleanup() {
  const now = Math.floor(Date.now() / 1000);

  db.prepare(`
    UPDATE matches SET status = 'expired'
    WHERE status = 'mutual' AND expires_at IS NOT NULL AND expires_at < ?
  `).run(now);

  db.prepare(`DELETE FROM chat_messages WHERE expires_at < ?`).run(now);

  db.prepare(`
    DELETE FROM chat_messages WHERE match_id IN (
      SELECT id FROM matches WHERE status = 'expired'
    )
  `).run();
}
