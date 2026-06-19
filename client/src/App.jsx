import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Onboarding from './screens/Onboarding';
import Home from './screens/Home';
import Matches from './screens/Matches';
import Chat from './screens/Chat';
import Profile from './screens/Profile';

function Gate({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="phone"><div className="screen"><p className="empty-state">loading…</p></div></div>;
  if (!user) return <Navigate to="/welcome" replace />;
  return children;
}

function OnboardingGate({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout hideNav />}>
            <Route path="/welcome" element={<OnboardingGate><Onboarding /></OnboardingGate>} />
          </Route>
          <Route element={<Layout />}>
            <Route path="/" element={<Gate><Home /></Gate>} />
            <Route path="/matches" element={<Gate><Matches /></Gate>} />
            <Route path="/chat/:matchId" element={<Gate><Chat /></Gate>} />
            <Route path="/profile" element={<Gate><Profile /></Gate>} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
