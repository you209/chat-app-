import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const { openCrisis } = useOutletContext();

  if (!user) return null;

  return (
    <div className="screen">
      <p className="screen-title">your profile</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#e8f7f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
          {user.avatar}
        </div>
        <div>
          <p style={{ fontSize: 18, fontWeight: 700 }}>{user.nickname}</p>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>anonymous</p>
        </div>
      </div>

      {user.topics?.length > 0 && (
        <div>
          <p className="field-label">your comfort topics</p>
          <div className="chips">
            {user.topics.map((t) => (
              <span key={t} className="chip selected" style={{ cursor: 'default' }}>{t}</span>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="field-label">your pace</p>
        <div style={{ background: 'var(--surface2)', borderRadius: 20, padding: '14px 18px' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{user.pace}</p>
        </div>
      </div>

      <div className="notice-safety">
        <p>🛡️ safety & privacy</p>
        <p>your real name and photo are never shared unless you choose to reveal them after connecting.</p>
        <button onClick={openCrisis} className="btn-primary" style={{ background: 'var(--safe)' }} aria-label="Access support resources">
          access support resources
        </button>
      </div>
    </div>
  );
}
