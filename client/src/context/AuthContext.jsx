import { createContext, useContext, useEffect, useState } from 'react';
import { api, getDeviceToken, setDeviceToken, setSessionToken, loadSessionToken } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const deviceToken = await getDeviceToken();
      if (deviceToken) {
        try {
          const cached = await loadSessionToken();
          if (cached) await setSessionToken(cached);
          const { sessionToken, user } = await api.session(deviceToken);
          await setSessionToken(sessionToken);
          setUser(user);
        } catch {
          await setDeviceToken('');
        }
      }
      setLoading(false);
    })();
  }, []);

  async function register({ nickname, avatar, pace, bio, topics }) {
    const { deviceToken, sessionToken, user } = await api.register({ nickname, avatar, pace, bio, topics });
    await setDeviceToken(deviceToken);
    await setSessionToken(sessionToken);
    setUser(user);
    return user;
  }

  async function refreshMe() {
    const me = await api.me();
    setUser(me);
    return me;
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, refreshMe, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
