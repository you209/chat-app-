import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import routes, { sendChatMessage } from './routes.js';
import adminRoutes from './admin.js';
import { verifySessionToken } from './auth.js';
import { db } from './db.js';
import { runCleanup } from './cleanup.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', routes);
app.use('/admin', adminRoutes);
app.get('/health', (req, res) => res.json({ ok: true }));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.use((socket, next) => {
  const userId = verifySessionToken(socket.handshake.auth?.token);
  if (!userId) return next(new Error('unauthorized'));
  socket.userId = userId;
  next();
});

io.on('connection', (socket) => {
  socket.on('join', (matchId) => {
    const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
    if (match && (match.user_a === socket.userId || match.user_b === socket.userId)) {
      socket.join(`match:${matchId}`);
    }
  });

  socket.on('message', async ({ matchId, body }, ack) => {
    const result = await sendChatMessage(io, { matchId, senderId: socket.userId, body });
    if (ack) ack(result);
  });
});

// Sweep expired ephemeral matches/messages every few minutes.
setInterval(runCleanup, 5 * 60 * 1000);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Gentle server listening on :${PORT}`));
