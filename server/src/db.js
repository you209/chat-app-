import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'gentle.sqlite');

import fs from 'fs';
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  device_token TEXT UNIQUE NOT NULL,
  nickname TEXT NOT NULL,
  avatar TEXT NOT NULL,
  pace TEXT NOT NULL DEFAULT 'flowing',
  bio TEXT DEFAULT '',
  real_name TEXT,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  report_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  last_active_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS topics (
  id TEXT PRIMARY KEY,
  label TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS user_topics (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS mood_checkins (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mood INTEGER NOT NULL, -- 1=struggling .. 4=good
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  user_a TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_topics TEXT NOT NULL DEFAULT '[]', -- JSON array of topic labels
  status TEXT NOT NULL DEFAULT 'pending', -- pending | waved_a | waved_b | mutual | expired | passed
  wave_a INTEGER NOT NULL DEFAULT 0,
  wave_b INTEGER NOT NULL DEFAULT 0,
  pass_a INTEGER NOT NULL DEFAULT 0,
  pass_b INTEGER NOT NULL DEFAULT 0,
  mutual_at INTEGER,
  expires_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS connects (
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (match_id, user_id)
);

CREATE TABLE IF NOT EXISTS reveals (
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  revealed_name INTEGER NOT NULL DEFAULT 0,
  revealed_photo INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (match_id, user_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id TEXT REFERENCES matches(id) ON DELETE SET NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'open', -- open | reviewed | dismissed
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_matches_users ON matches(user_a, user_b);
CREATE INDEX IF NOT EXISTS idx_chat_match ON chat_messages(match_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id, created_at);
`);

const DEFAULT_TOPICS = [
  'nature', 'art', 'music', 'parenting', 'gaming', 'cooking', 'tech',
  'reading', 'animals', 'film', 'writing', 'fitness', 'spirituality', 'crafts'
];

const insertTopic = db.prepare('INSERT OR IGNORE INTO topics (id, label) VALUES (?, ?)');
for (const label of DEFAULT_TOPICS) {
  insertTopic.run(label, label);
}

export default db;
