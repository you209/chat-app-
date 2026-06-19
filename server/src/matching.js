import { nanoid } from 'nanoid';
import { db } from './db.js';

const DAY = 24 * 60 * 60;
const STALE_RESPONSE_DAYS = 3;
const CRISIS_MOOD = 1; // "really struggling"

// v1 matching: simple comfort-topic overlap score, no ML.
// For each active user without a pending/open match today, rank every
// other eligible user by (a) number of shared topics, breaking ties
// randomly, and pair the top scorers. A user already in a crisis-low mood
// is not paired with someone who has gone quiet (no activity in
// STALE_RESPONSE_DAYS) — pacing safety, not enforcement.
export function runDailyMatching() {
  const users = db.prepare(`
    SELECT u.id, u.last_active_at,
      (SELECT mood FROM mood_checkins WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) AS latest_mood
    FROM users u
    WHERE u.status = 'active'
  `).all();

  const topicsByUser = new Map();
  const rows = db.prepare('SELECT user_id, topic_id FROM user_topics').all();
  for (const r of rows) {
    if (!topicsByUser.has(r.user_id)) topicsByUser.set(r.user_id, new Set());
    topicsByUser.get(r.user_id).add(r.topic_id);
  }

  const alreadyMatchedToday = new Set();
  const todayStart = Math.floor(Date.now() / 1000) - DAY;
  const recent = db.prepare(`
    SELECT user_a, user_b FROM matches WHERE created_at >= ?
  `).all(todayStart);
  for (const m of recent) {
    alreadyMatchedToday.add(m.user_a);
    alreadyMatchedToday.add(m.user_b);
  }

  const now = Math.floor(Date.now() / 1000);
  const isStale = (u) => now - u.last_active_at > STALE_RESPONSE_DAYS * DAY;

  const eligible = users.filter((u) => !alreadyMatchedToday.has(u.id));
  const created = [];

  const paired = new Set();
  for (const user of eligible) {
    if (paired.has(user.id)) continue;
    const userTopics = topicsByUser.get(user.id) || new Set();

    let best = null;
    let bestScore = -1;
    for (const other of eligible) {
      if (other.id === user.id || paired.has(other.id)) continue;
      if (user.latest_mood === CRISIS_MOOD && isStale(other)) continue;
      if (other.latest_mood === CRISIS_MOOD && isStale(user)) continue;

      const otherTopics = topicsByUser.get(other.id) || new Set();
      const shared = [...userTopics].filter((t) => otherTopics.has(t));
      const score = shared.length + Math.random() * 0.01; // tiny jitter for tie-break
      if (score > bestScore) {
        bestScore = score;
        best = { user: other, shared };
      }
    }

    if (best) {
      paired.add(user.id);
      paired.add(best.user.id);
      const id = nanoid();
      db.prepare(`
        INSERT INTO matches (id, user_a, user_b, shared_topics, status)
        VALUES (?, ?, ?, ?, 'pending')
      `).run(id, user.id, best.user.id, JSON.stringify(best.shared));
      created.push(id);
    }
  }

  return created;
}
