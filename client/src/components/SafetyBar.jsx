import './SafetyBar.css';

const QUICK_EXIT_URL = import.meta.env.VITE_QUICK_EXIT_URL || 'https://www.bom.gov.au';

// Quick exit replaces the current history entry so there's no back-button
// trail leading back into the app.
function quickExit() {
  window.location.replace(QUICK_EXIT_URL);
}

export default function SafetyBar({ onOpenCrisis }) {
  return (
    <div className="safety-bar" role="banner">
      <span className="app-name">gentle</span>
      <div className="bar-actions">
        <button className="btn-crisis" onClick={onOpenCrisis} aria-label="Access crisis support lines">
          💛 support
        </button>
        <button className="btn-exit" onClick={quickExit} aria-label="Quick exit — leave the app immediately">
          exit now
        </button>
      </div>
    </div>
  );
}
