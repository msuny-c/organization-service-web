import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, authStorage } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authStorage.getUser());
  const [token, setToken] = useState(() => authStorage.getToken());
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  const login = async (credentials) => {
    const response = await authApi.login(credentials);
    const data = response.data;
    authStorage.set(data.token, { username: data.username, role: data.role });
    setUser({ username: data.username, role: data.role });
    setToken(data.token);
    return data;
  };

  const register = async (credentials) => {
    const response = await authApi.register(credentials);
    const data = response.data;
    authStorage.set(data.token, { username: data.username, role: data.role });
    setUser({ username: data.username, role: data.role });
    setToken(data.token);
    return data;
  };

  const logout = () => {
    authStorage.clear();
    setUser(null);
    setToken(null);
  };

  const value = useMemo(() => ({
    user,
    token,
    isReady,
    isAuthenticated: Boolean(token),
    login,
    register,
    logout,
  }), [user, token, isReady]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
