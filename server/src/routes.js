import express from 'express';
import { nanoid } from 'nanoid';
import { db } from './db.js';
import { requireAuth, createDeviceAccount, findUserByDeviceToken, issueSessionToken } from './auth.js';
import { runDailyMatching } from './matching.js';
import { moderateText } from './moderation.js';

const router = express.Router();
const DAY = 24 * 60 * 60;
const REPORT_WINDOW_DAYS = 7;
const REPORT_THRESHOLD = 3;

function serializeUser(u) {
  return { id: u.id, nickname: u.nickname, avatar: u.avatar, pace: u.pace, bio: u.bio };
}

// --- Auth / onboarding ---

router.post('/auth/register', (req, res) => {
  const { nickname, avatar, pace, bio, topics } = req.body;
  if (!nickname || !avatar) return res.status(400).json({ error: 'nickname and avatar required' });

  const deviceToken = createDeviceAccount();
  const id = nanoid();
  db.prepare(`
    INSERT INTO users (id, device_token, nickname, avatar, pace, bio)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, deviceToken, nickname.slice(0, 24), avatar, pace || 'flowing', (bio || '').slice(0, 200));

  if (Array.isArray(topics)) {
    const insertTopic = db.prepare('INSERT OR IGNORE INTO user_topics (user_id, topic_id) VALUES (?, ?)');
    for (const t of topics) insertTopic.run(id, t);
  }

  const sessionToken = issueSessionToken(id);
  res.json({ deviceToken, sessionToken, user: serializeUser({ id, nickname, avatar, pace, bio }) });
});

// Exchange a previously-issued device token for a fresh session JWT
// (e.g. on app relaunch, after the prior session token expired).
router.post('/auth/session', (req, res) => {
  const { deviceToken } = req.body;
  const user = deviceToken && findUserByDeviceToken(deviceToken);
  if (!user) return res.status(401).json({ error: 'unknown device token' });
  const sessionToken = issueSessionToken(user.id);
  res.json({ sessionToken, user: serializeUser(user) });
});

router.get('/topics', (req, res) => {
  res.json(db.prepare('SELECT id, label FROM topics').all());
});

// --- Profile ---

router.get('/me', requireAuth, (req, res) => {
  const topics = db.prepare('SELECT topic_id FROM user_topics WHERE user_id = ?').all(req.user.id).map((r) => r.topic_id);
  res.json({ ...serializeUser(req.user), topics });
});

router.patch('/me', requireAuth, (req, res) => {
  const { nickname, avatar, pace, bio, topics } = req.body;
  db.prepare(`
    UPDATE users SET nickname = COALESCE(?, nickname), avatar = COALESCE(?, avatar),
      pace = COALESCE(?, pace), bio = COALESCE(?, bio) WHERE id = ?
  `).run(nickname?.slice(0, 24), avatar, pace, bio?.slice(0, 200), req.user.id);

  if (Array.isArray(topics)) {
    db.prepare('DELETE FROM user_topics WHERE user_id = ?').run(req.user.id);
    const insertTopic = db.prepare('INSERT OR IGNORE INTO user_topics (user_id, topic_id) VALUES (?, ?)');
    for (const t of topics) insertTopic.run(req.user.id, t);
  }
  res.json({ ok: true });
});

// --- Mood check-in ---

router.post('/mood', requireAuth, (req, res) => {
  const { mood } = req.body; // 1..4
  if (![1, 2, 3, 4].includes(mood)) return res.status(400).json({ error: 'mood must be 1-4' });
  db.prepare('INSERT INTO mood_checkins (id, user_id, mood) VALUES (?, ?, ?)').run(nanoid(), req.user.id, mood);
  res.json({ ok: true });
});

// --- Matching ---

// On-demand trigger for MVP (would be a daily cron in production).
router.post('/matching/run', (req, res) => {
  const created = runDailyMatching();
  res.json({ created: created.length });
});

router.get('/matches', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT m.*,
      CASE WHEN m.user_a = ? THEN m.user_b ELSE m.user_a END AS other_id,
      CASE WHEN m.user_a = ? THEN m.wave_a ELSE m.wave_b END AS my_wave,
      CASE WHEN m.user_a = ? THEN m.wave_b ELSE m.wave_a END AS their_wave,
      CASE WHEN m.user_a = ? THEN m.pass_a ELSE m.pass_b END AS my_pass
    FROM matches m
    WHERE (m.user_a = ? OR m.user_b = ?) AND m.status NOT IN ('expired', 'passed')
    ORDER BY m.created_at DESC
  `).all(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id);

  const result = rows.filter((r) => !r.my_pass).map((r) => {
    const other = db.prepare('SELECT * FROM users WHERE id = ?').get(r.other_id);
    return {
      id: r.id,
      status: r.status,
      sharedTopics: JSON.parse(r.shared_topics),
      myWave: !!r.my_wave,
      theirWave: !!r.their_wave,
      other: serializeUser(other),
      createdAt: r.created_at
    };
  });
  res.json(result);
});

router.post('/matches/:id/wave', requireAuth, (req, res) => {
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id);
  if (!match) return res.status(404).json({ error: 'not found' });
  const isA = match.user_a === req.user.id;
  if (!isA && match.user_b !== req.user.id) return res.status(403).json({ error: 'forbidden' });

  const col = isA ? 'wave_a' : 'wave_b';
  db.prepare(`UPDATE matches SET ${col} = 1 WHERE id = ?`).run(match.id);

  const updated = db.prepare('SELECT * FROM matches WHERE id = ?').get(match.id);
  if (updated.wave_a && updated.wave_b && updated.status !== 'mutual') {
    const expiresAt = Math.floor(Date.now() / 1000) + DAY;
    db.prepare(`UPDATE matches SET status = 'mutual', mutual_at = unixepoch(), expires_at = ? WHERE id = ?`).run(expiresAt, match.id);
  }
  res.json({ ok: true });
});

router.post('/matches/:id/pass', requireAuth, (req, res) => {
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id);
  if (!match) return res.status(404).json({ error: 'not found' });
  const isA = match.user_a === req.user.id;
  if (!isA && match.user_b !== req.user.id) return res.status(403).json({ error: 'forbidden' });
  const col = isA ? 'pass_a' : 'pass_b';
  db.prepare(`UPDATE matches SET ${col} = 1 WHERE id = ?`).run(match.id);
  res.json({ ok: true });
});

// --- Ephemeral chat ---

router.get('/matches/:id/messages', requireAuth, (req, res) => {
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id);
  if (!match || (match.user_a !== req.user.id && match.user_b !== req.user.id)) {
    return res.status(404).json({ error: 'not found' });
  }
  const now = Math.floor(Date.now() / 1000);
  const messages = db.prepare(`
    SELECT id, sender_id, body, created_at FROM chat_messages
    WHERE match_id = ? AND expires_at > ? ORDER BY created_at ASC
  `).all(match.id, now);
  res.json(messages);
});

// Sends a chat message: runs it through moderation, persists it with a
// short TTL (cleaned up by a periodic job) unless the match has already
// become a permanent connection, then broadcasts over the match's socket room.
export async function sendChatMessage(io, { matchId, senderId, body }) {
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
  if (!match) return { error: 'not found' };
  if (match.user_a !== senderId && match.user_b !== senderId) return { error: 'forbidden' };
  if (match.status !== 'mutual' && match.status !== 'connected') return { error: 'chat not open' };

  const trimmed = (body || '').trim().slice(0, 2000);
  if (!trimmed) return { error: 'empty message' };

  const moderation = await moderateText(trimmed);
  if (moderation.flagged) {
    return { error: "this message couldn't be sent" };
  }

  const id = nanoid();
  const ttlSeconds = match.status === 'connected' ? 365 * DAY : DAY;
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  db.prepare(`
    INSERT INTO chat_messages (id, match_id, sender_id, body, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, matchId, senderId, trimmed, expiresAt);

  const message = { id, matchId, senderId, body: trimmed, createdAt: Math.floor(Date.now() / 1000) };
  io.to(`match:${matchId}`).emit('message', message);
  return { message };
}

// --- Connect / reveal ---

router.post('/matches/:id/connect', requireAuth, (req, res) => {
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id);
  if (!match || (match.user_a !== req.user.id && match.user_b !== req.user.id)) {
    return res.status(404).json({ error: 'not found' });
  }
  db.prepare('INSERT OR IGNORE INTO connects (match_id, user_id) VALUES (?, ?)').run(match.id, req.user.id);

  const connects = db.prepare('SELECT user_id FROM connects WHERE match_id = ?').all(match.id);
  const bothConnected = connects.length === 2;
  if (bothConnected) {
    db.prepare(`UPDATE matches SET status = 'connected', expires_at = NULL WHERE id = ?`).run(match.id);
    // Persisted permanently from here — extend any existing messages' TTL.
    db.prepare(`UPDATE chat_messages SET expires_at = ? WHERE match_id = ?`)
      .run(Math.floor(Date.now() / 1000) + 365 * DAY, match.id);
  }
  res.json({ ok: true, mutual: bothConnected });
});

router.post('/matches/:id/reveal', requireAuth, (req, res) => {
  const { name, photo } = req.body;
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id);
  if (!match || match.status !== 'connected') return res.status(400).json({ error: 'not connected' });
  if (match.user_a !== req.user.id && match.user_b !== req.user.id) return res.status(404).json({ error: 'not found' });

  db.prepare(`
    INSERT INTO reveals (match_id, user_id, revealed_name, revealed_photo)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(match_id, user_id) DO UPDATE SET revealed_name = ?, revealed_photo = ?
  `).run(match.id, req.user.id, name ? 1 : 0, photo ? 1 : 0, name ? 1 : 0, photo ? 1 : 0);
  res.json({ ok: true });
});

// --- Reports / safety ---

router.post('/reports', requireAuth, (req, res) => {
  const { reportedId, matchId, reason } = req.body;
  if (!reportedId) return res.status(400).json({ error: 'reportedId required' });
  const reportedUser = db.prepare('SELECT id FROM users WHERE id = ?').get(reportedId);
  if (!reportedUser) return res.status(404).json({ error: 'reported user not found' });

  const id = nanoid();
  db.prepare(`
    INSERT INTO reports (id, reporter_id, reported_id, match_id, reason)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, req.user.id, reportedId, matchId || null, (reason || '').slice(0, 500));

  const windowStart = Math.floor(Date.now() / 1000) - REPORT_WINDOW_DAYS * DAY;
  const { count } = db.prepare(`
    SELECT COUNT(*) AS count FROM reports WHERE reported_id = ? AND created_at >= ?
  `).get(reportedId, windowStart);

  if (count >= REPORT_THRESHOLD) {
    db.prepare(`UPDATE users SET status = 'suspended', report_count = ? WHERE id = ?`).run(count, reportedId);
  } else {
    db.prepare(`UPDATE users SET report_count = ? WHERE id = ?`).run(count, reportedId);
  }
  res.json({ ok: true });
});

export default router;
