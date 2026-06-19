import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { db } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'gentle-dev-secret-change-me';

// Device-bound auth: the client generates/stores an opaque device token
// (e.g. via Capacitor Preferences on mobile, localStorage on web) and
// trades it here for a signed session JWT. No email or password collected.
export function issueSessionToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '90d' });
}

export function verifySessionToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload.sub;
  } catch {
    return null;
  }
}

export function createDeviceAccount() {
  const deviceToken = nanoid(32);
  return deviceToken;
}

export function findUserByDeviceToken(deviceToken) {
  return db.prepare('SELECT * FROM users WHERE device_token = ?').get(deviceToken);
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const userId = token && verifySessionToken(token);
  if (!userId) return res.status(401).json({ error: 'unauthorized' });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user || user.status === 'suspended') return res.status(401).json({ error: 'unauthorized' });
  req.user = user;
  db.prepare('UPDATE users SET last_active_at = unixepoch() WHERE id = ?').run(userId);
  next();
}
