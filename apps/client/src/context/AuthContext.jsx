import { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthContext } from './auth-context.js';
import { authApi } from '../lib/api.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshSession = useCallback(async () => {
    try {
      const data = await authApi.getMe();
      setUser(data?.user || null);
      return data?.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    authApi
      .getMe()
      .then((data) => {
        if (isMounted) {
          setUser(data?.user || null);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authApi.login(credentials);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setError(err.message || 'Authentication failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout request completed with warning:', err.message);
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      roles: user?.roles || [],
      permissions: user?.permissions || [],
      isAuthenticated: Boolean(user),
      isLoading,
      error,
      login,
      logout,
      refreshSession,
    }),
    [user, isLoading, error, login, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
