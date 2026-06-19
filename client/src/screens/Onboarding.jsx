import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AVATARS = ['🌿', '🌙', '🌊', '🔥', '⛰️', '🌸', '🐉', '🎨', '🍃', '⭐', '🦋', '🌻'];
const TOPICS = [
  'nature', 'art', 'music', 'parenting', 'gaming', 'cooking', 'tech',
  'reading', 'animals', 'film', 'writing', 'fitness', 'spirituality', 'crafts'
];
const PACES = [
  { id: 'slow', label: '🐢 slow and gentle — a few messages a day' },
  { id: 'flowing', label: '🌿 whenever feels right — no pressure' },
  { id: 'chatty', label: '🌊 flowing — back and forth feels good' }
];

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [nickname, setNickname] = useState('');
  const [topics, setTopics] = useState([]);
  const [bio, setBio] = useState('');
  const [pace, setPace] = useState('flowing');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  function toggleTopic(t) {
    setTopics((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function finish() {
    if (!nickname.trim()) {
      setError('please choose a nickname');
      setStep(0);
      return;
    }
    try {
      await register({ nickname: nickname.trim(), avatar, pace, bio, topics });
      navigate('/');
    } catch {
      setError('something went wrong — please try again');
    }
  }

  return (
    <div className="screen">
      {step === 0 && (
        <>
          <div className="steps" aria-label="Step 1 of 3">
            <div className="step-dot active" />
            <div className="step-dot" />
            <div className="step-dot" />
          </div>
          <p className="screen-title">pick your avatar 🌱</p>
          <p className="screen-sub">this is all anyone sees until you both choose to connect.</p>

          <div className="avatar-grid" role="group" aria-label="Avatar options">
            {AVATARS.map((a) => (
              <button
                key={a}
                className={`avatar-option${avatar === a ? ' selected' : ''}`}
                onClick={() => setAvatar(a)}
                aria-label={`Choose avatar ${a}`}
                aria-pressed={avatar === a}
              >
                {a}
              </button>
            ))}
          </div>

          <div>
            <label className="field-label" htmlFor="nickname">your nickname</label>
            <input
              id="nickname"
              className="rounded-input"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="choose a nickname"
              maxLength={24}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="bio">what helps you on hard days? (optional)</label>
            <input
              id="bio"
              className="rounded-input"
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="a short line shown on your match card"
              maxLength={120}
            />
          </div>

          {error && <p style={{ color: 'var(--safe2)', fontSize: 13 }}>{error}</p>}

          <button className="btn-primary" onClick={() => setStep(1)} style={{ marginTop: 'auto' }}>
            next →
          </button>
        </>
      )}

      {step === 1 && (
        <>
          <div className="steps" aria-label="Step 2 of 3">
            <div className="step-dot done" />
            <div className="step-dot active" />
            <div className="step-dot" />
          </div>
          <p className="screen-title">what brings you comfort? ☁️</p>
          <p className="screen-sub">pick as many as feel right. we use these to find people who get you.</p>

          <div className="chips" role="group" aria-label="Comfort topics">
            {TOPICS.map((t) => (
              <button
                key={t}
                className={`chip${topics.includes(t) ? ' selected' : ''}`}
                onClick={() => toggleTopic(t)}
                aria-pressed={topics.includes(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <button className="btn-primary" onClick={() => setStep(2)} style={{ marginTop: 'auto' }}>
            next →
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <div className="steps" aria-label="Step 3 of 3">
            <div className="step-dot done" />
            <div className="step-dot done" />
            <div className="step-dot active" />
          </div>
          <p className="screen-title">how do you like to chat? 💬</p>
          <p className="screen-sub">no right answer. this helps us match you with someone on the same wavelength.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} role="group" aria-label="Chat pace options">
            {PACES.map((p) => (
              <button
                key={p.id}
                className={`chip chip-pace${pace === p.id ? ' selected' : ''}`}
                onClick={() => setPace(p.id)}
                aria-pressed={pace === p.id}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="notice-success">
            <p>no read receipts. no online indicators.</p>
            <p>reply when you're ready. gentle never pressures you.</p>
          </div>

          {error && <p style={{ color: 'var(--safe2)', fontSize: 13 }}>{error}</p>}

          <button className="btn-primary" onClick={finish} style={{ marginTop: 'auto' }}>
            let's go 🌱
          </button>
        </>
      )}
    </div>
  );
}
