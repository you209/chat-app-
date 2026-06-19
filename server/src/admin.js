import express from 'express';
import { db } from './db.js';

const router = express.Router();

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'change-me';

function basicAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme !== 'Basic' || !encoded) {
    res.set('WWW-Authenticate', 'Basic realm="gentle-admin"');
    return res.status(401).send('Authentication required');
  }
  const [user, pass] = Buffer.from(encoded, 'base64').toString().split(':');
  if (user !== ADMIN_USER || pass !== ADMIN_PASS) {
    res.set('WWW-Authenticate', 'Basic realm="gentle-admin"');
    return res.status(401).send('Invalid credentials');
  }
  next();
}

router.use(basicAuth);

router.get('/reports', (req, res) => {
  const reports = db.prepare(`
    SELECT r.*, reporter.nickname AS reporter_nickname, reported.nickname AS reported_nickname,
      reported.status AS reported_status, reported.report_count AS reported_report_count
    FROM reports r
    JOIN users reporter ON reporter.id = r.reporter_id
    JOIN users reported ON reported.id = r.reported_id
    ORDER BY r.created_at DESC
  `).all();
  res.json(reports);
});

router.post('/reports/:id/resolve', (req, res) => {
  const { action } = req.body; // 'dismiss' | 'suspend' | 'reinstate'
  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  if (!report) return res.status(404).json({ error: 'not found' });

  if (action === 'dismiss') {
    db.prepare(`UPDATE reports SET status = 'dismissed' WHERE id = ?`).run(report.id);
  } else if (action === 'suspend') {
    db.prepare(`UPDATE reports SET status = 'reviewed' WHERE id = ?`).run(report.id);
    db.prepare(`UPDATE users SET status = 'suspended' WHERE id = ?`).run(report.reported_id);
  } else if (action === 'reinstate') {
    db.prepare(`UPDATE reports SET status = 'reviewed' WHERE id = ?`).run(report.id);
    db.prepare(`UPDATE users SET status = 'active' WHERE id = ?`).run(report.reported_id);
  }
  res.json({ ok: true });
});

router.get('/users', (req, res) => {
  res.json(db.prepare('SELECT id, nickname, status, report_count, created_at, last_active_at FROM users ORDER BY report_count DESC').all());
});

export default router;
