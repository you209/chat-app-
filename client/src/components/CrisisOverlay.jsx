import { useEffect, useRef } from 'react';

const LINES = [
  { name: 'Lifeline', tel: '131114', display: '13 11 14', desc: '24/7 crisis support & suicide prevention' },
  { name: 'Beyond Blue', tel: '1300224636', display: '1300 22 4636', desc: 'anxiety, depression & mental wellbeing' },
  { name: 'Suicide Call Back Service', tel: '1300659467', display: '1300 659 467', desc: 'free professional counselling' },
  { name: 'MindSpot', tel: '1800614434', display: '1800 614 434', desc: 'free online & phone treatment courses' }
];

export default function CrisisOverlay({ open, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="crisis-overlay open" role="dialog" aria-modal="true" aria-label="Support resources" ref={ref} tabIndex={-1}>
      <p className="crisis-title">you're not alone 💛</p>
      <p className="crisis-sub">trained humans available 24/7 — free, confidential.</p>

      {LINES.map((line) => (
        <a
          key={line.tel}
          href={`tel:${line.tel}`}
          className="crisis-line"
          aria-label={`Call ${line.name} on ${line.display}`}
        >
          <span className="crisis-line-name">{line.name}</span>
          <span className="crisis-line-num">{line.display}</span>
          <span className="crisis-line-desc">{line.desc}</span>
        </a>
      ))}

      <button className="btn-secondary" onClick={onClose} style={{ width: '100%' }} aria-label="Close support panel">
        close
      </button>
    </div>
  );
}
