import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const MOODS = [
  { value: 1, emoji: '😔', label: 'Really struggling' },
  { value: 2, emoji: '😐', label: 'A bit low' },
  { value: 3, emoji: '🙂', label: 'Okay' },
  { value: 4, emoji: '😊', label: 'Pretty good' }
];

export default function Home() {
  const { user } = useAuth();
  const [mood, setMood] = useState(null);
  const [matches, setMatches] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
    try {
      const data = await api.matches();
      setMatches(data);
    } catch {
      // ignore — surfaced via empty state
    }
  }

  async function pickMood(value) {
    setMood(value);
    try {
      await api.checkInMood(value);
    } catch {
      // mood check-in is best-effort and never blocks the UI
    }
  }

  async function wave(matchId) {
    await api.wave(matchId);
    navigate('/matches');
  }

  async function pass(matchId) {
    await api.pass(matchId);
    setMatches((prev) => prev.filter((m) => m.id !== matchId));
  }

  const pendingMatch = matches.find((m) => m.status === 'pending' && !m.myWave);

  return (
    <div className="screen">
      <div className="greeting-card">
        <p className="greeting-hi">hello</p>
        <p className="greeting-name">{user?.avatar} {user?.nickname}</p>
        <p className="greeting-q">how are you feeling today?</p>
      </div>

      <div>
        <p className="field-label">your mood right now</p>
        <div className="mood-row" role="group" aria-label="Mood selector">
          {MOODS.map((m) => (
            <button
              key={m.value}
              className={`mood-btn${mood === m.value ? ' selected' : ''}`}
              onClick={() => pickMood(m.value)}
              aria-label={m.label}
            >
              {m.emoji}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="field-label">today's connection</p>
        {pendingMatch ? (
          <div className="match-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="match-avatar">{pendingMatch.other.avatar}</div>
              <div>
                <p className="match-name">{pendingMatch.other.nickname}</p>
                <p className="match-anon">anonymous until you both connect</p>
              </div>
            </div>
            {pendingMatch.sharedTopics.length > 0 && (
              <div>
                <p className="shared-label">you both love</p>
                <div className="shared-chips">
                  {pendingMatch.sharedTopics.map((t) => (
                    <span key={t} className="shared-chip">{t}</span>
                  ))}
                </div>
              </div>
            )}
            {pendingMatch.other.bio && <p className="match-bio">"{pendingMatch.other.bio}"</p>}
            <div className="match-actions">
              <button className="btn-pass" onClick={() => pass(pendingMatch.id)} aria-label="Pass on this connection">
                pass
              </button>
              <button className="btn-wave" onClick={() => wave(pendingMatch.id)} aria-label={`Wave hello to ${pendingMatch.other.nickname}`}>
                wave hello 👋
              </button>
            </div>
            <p className="expiry-note">chat opens if they wave back · disappears in 24h</p>
          </div>
        ) : (
          <p className="empty-state">no new connection today. check back tomorrow 🌱</p>
        )}
      </div>
    </div>
  );
}
