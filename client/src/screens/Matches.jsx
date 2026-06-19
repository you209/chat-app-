import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.matches().then(setMatches).catch(() => {});
  }, []);

  const openChats = matches.filter((m) => m.status === 'mutual' || m.status === 'connected');

  return (
    <div className="screen">
      <p className="screen-title">your chats</p>
      {openChats.length === 0 && <p className="empty-state">no open chats yet. wave hello on the home screen 👋</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {openChats.map((m) => (
          <button
            key={m.id}
            onClick={() => navigate(`/chat/${m.id}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, background: 'var(--bg)',
              borderRadius: 20, padding: 16, border: 'none', cursor: 'pointer', textAlign: 'left', minHeight: 52
            }}
            aria-label={`Open chat with ${m.other.nickname}`}
          >
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#2a2a45', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
              {m.other.avatar}
            </div>
            <div>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 15 }}>{m.other.nickname}</p>
              <p style={{ color: '#9e9abc', fontSize: 12 }}>{m.status === 'connected' ? 'connected' : 'anonymous · chat not saved yet'}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
