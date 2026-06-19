import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SafetyBar from './SafetyBar';
import CrisisOverlay from './CrisisOverlay';
import NavBar from './NavBar';

export default function Layout({ hideNav }) {
  const [crisisOpen, setCrisisOpen] = useState(false);

  return (
    <div className="phone">
      <SafetyBar onOpenCrisis={() => setCrisisOpen(true)} />
      <Outlet context={{ openCrisis: () => setCrisisOpen(true) }} />
      {!hideNav && <NavBar />}
      <CrisisOverlay open={crisisOpen} onClose={() => setCrisisOpen(false)} />
    </div>
  );
}
