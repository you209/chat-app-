import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { connectSocket } from '../lib/socket';
import { useAuth } from '../context/AuthContext';

export default function Chat() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState('');
  const [connectSent, setConnectSent] = useState(false);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const all = await api.matches();
      const found = all.find((m) => m.id === matchId);
      if (!cancelled) setMatch(found || null);
      const msgs = await api.messages(matchId);
      if (!cancelled) setMessages(msgs);
    }
    load();

    const socket = connectSocket();
    socketRef.current = socket;
    socket.emit('join', matchId);
    socket.on('message', (msg) => {
      if (msg.matchId === matchId) setMessages((prev) => [...prev, msg]);
    });

    return () => {
      cancelled = true;
      socket.off('message');
    };
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const body = draft.trim();
    if (!body || !socketRef.current) return;
    setDraft('');
    setSendError('');
    socketRef.current.emit('message', { matchId, body }, (result) => {
      if (result?.error) setSendError(result.error);
    });
  }

  async function connect() {
    const res = await api.connect(matchId);
    setConnectSent(true);
    if (res.mutual) {
      setMatch((m) => (m ? { ...m, status: 'connected' } : m));
    }
  }

  async function report() {
    if (!match) return;
    await api.report({ reportedId: match.other.id, matchId, reason: 'reported from chat' });
    alert('thanks — this has been sent for review. you can leave this chat at any time.');
  }

  if (!match) return <div className="screen"><p className="empty-state">loading chat…</p></div>;

  return (
    <div className="screen">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/matches')} aria-label="Back to chats" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>←</button>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#2a2a45', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
          {match.other.avatar}
        </div>
        <div>
          <p style={{ fontSize: 16, fontWeight: 700 }}>{match.other.nickname}</p>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>
            {match.status === 'connected' ? 'connected' : 'anonymous · chat not saved yet'}
          </p>
        </div>
        {match.status !== 'connected' && (
          <button
            onClick={connect}
            disabled={connectSent}
            style={{
              marginLeft: 'auto', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 'var(--radius)',
              fontSize: 13, fontWeight: 700, padding: '8px 16px', cursor: connectSent ? 'default' : 'pointer', opacity: connectSent ? 0.6 : 1
            }}
            aria-label="Connect and save this chat"
          >
            {connectSent ? 'requested' : 'connect'}
          </button>
        )}
      </div>

      {match.status !== 'connected' && (
        <div className="ephemeral-note" role="note">
          💭 this chat isn't saved yet — tap connect if you'd like to keep it
        </div>
      )}

      <div className="chat-area" role="log" aria-live="polite" aria-label="Chat messages">
        {messages.map((m) => (
          <div key={m.id} className={`bubble ${m.senderId === user.id ? 'me' : 'them'}`}>
            {m.body}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {sendError && <p style={{ color: 'var(--safe2)', fontSize: 13, textAlign: 'center' }}>{sendError}</p>}

      <div className="chat-input-row">
        <input
          className="chat-input"
          type="text"
          placeholder="say something kind..."
          aria-label="Type a message"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button className="btn-send" onClick={send} disabled={!draft.trim()} aria-label="Send message">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M2 12L22 2L15 22L11 13L2 12Z" /></svg>
        </button>
      </div>

      <button
        onClick={report}
        style={{ background: 'none', border: 'none', color: 'var(--safe2)', fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}
        aria-label={`Report ${match.other.nickname}`}
      >
        🚩 report this chat
      </button>
    </div>
  );
}
