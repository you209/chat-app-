import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

const SUPPORT_OPTIONS = [
  'i need someone to listen',
  'just want some company',
  'going through a hard time',
  'feeling really lonely',
  'dealing with grief or loss',
  'anxiety has been loud lately',
  'feeling burnt out',
  'starting over after something hard'
];

export default function Profile() {
  const { user, setUser } = useAuth();
  const { openCrisis } = useOutletContext();
  const [editingSupport, setEditingSupport] = useState(false);
  const [supportNeeds, setSupportNeeds] = useState(user?.supportNeeds || []);
  const [supportNote, setSupportNote] = useState(user?.supportNote || '');
  const [saveError, setSaveError] = useState('');

  if (!user) return null;

  function toggleSupportNeed(id) {
    setSupportNeeds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function saveSupport() {
    setSaveError('');
    try {
      await api.updateMe({ supportNeeds, supportNote: supportNote.trim() });
      setUser((u) => ({ ...u, supportNeeds, supportNote: supportNote.trim() }));
      setEditingSupport(false);
    } catch (err) {
      setSaveError(err.message === "this couldn't be saved" ? "that note couldn't be saved — try rephrasing it" : 'something went wrong');
    }
  }

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

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <p className="field-label">what's going on for you right now</p>
          {!editingSupport && (
            <button
              onClick={() => setEditingSupport(true)}
              style={{ background: 'none', border: 'none', color: 'var(--accent2)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
            >
              edit
            </button>
          )}
        </div>

        {!editingSupport ? (
          (user.supportNeeds?.length > 0 || user.supportNote) ? (
            <>
              <div className="chips">
                {user.supportNeeds?.map((s) => (
                  <span key={s} className="chip selected-purple" style={{ cursor: 'default' }}>{s}</span>
                ))}
              </div>
              {user.supportNote && <p className="match-bio" style={{ color: 'var(--muted)' }}>"{user.supportNote}"</p>}
            </>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>not shared yet — only visible to your matches, for context.</p>
          )
        ) : (
          <>
            <div className="chips" role="group" aria-label="What kind of support you're looking for">
              {SUPPORT_OPTIONS.map((s) => (
                <button
                  key={s}
                  className={`chip${supportNeeds.includes(s) ? ' selected-purple' : ''}`}
                  onClick={() => toggleSupportNeed(s)}
                  aria-pressed={supportNeeds.includes(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <input
              className="rounded-input"
              type="text"
              value={supportNote}
              onChange={(e) => setSupportNote(e.target.value)}
              placeholder="or, in your own words"
              maxLength={300}
              style={{ marginTop: 10 }}
            />
            {saveError && <p style={{ color: 'var(--safe2)', fontSize: 13 }}>{saveError}</p>}
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setEditingSupport(false)}>cancel</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={saveSupport}>save</button>
            </div>
          </>
        )}
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
