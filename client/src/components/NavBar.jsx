import { NavLink } from 'react-router-dom';

const ICONS = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  profile: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93A10 10 0 1 0 4.93 19.07M12 2v2m0 18v2M2 12H0m22 0h-2" />
    </svg>
  )
};

export default function NavBar() {
  return (
    <nav className="nav-bar" aria-label="Main navigation">
      <NavLink to="/" className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`} aria-label="Home" end>
        {ICONS.home}
        <span className="nav-label">home</span>
      </NavLink>
      <NavLink to="/matches" className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`} aria-label="Chat">
        {ICONS.chat}
        <span className="nav-label">chat</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `nav-btn${isActive ? ' active' : ''}`} aria-label="Profile">
        {ICONS.profile}
        <span className="nav-label">profile</span>
      </NavLink>
    </nav>
  );
}
