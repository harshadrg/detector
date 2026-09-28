import { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthContext } from './auth-context.js';
import { authApi, setContextRole, getContextRole } from '../lib/api.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [activeContextRole, setActiveRoleState] = useState(getContextRole());
  const [availableContextRoles, setAvailableContextRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadContextRoles = useCallback(async () => {
    try {
      const data = await authApi.getContextRoles();
      if (Array.isArray(data?.roles)) {
        setAvailableContextRoles(data.roles);
      }
    } catch (err) {
      console.warn('Could not load context roles:', err.message);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const data = await authApi.getMe();
      setUser(data?.user || null);
      if (data?.user?.canContextSwitch) {
        loadContextRoles();
      }
      return data?.user;
    } catch {
      setUser(null);
      return null;
    }
  }, [loadContextRoles]);

  useEffect(() => {
    let isMounted = true;

    authApi
      .getMe()
      .then((data) => {
        if (isMounted) {
          const fetchedUser = data?.user || null;
          setUser(fetchedUser);
          setIsLoading(false);
          if (fetchedUser?.canContextSwitch) {
            authApi.getContextRoles().then((roleData) => {
              if (isMounted && Array.isArray(roleData?.roles)) {
                setAvailableContextRoles(roleData.roles);
              }
            });
          }
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

  const switchContextRole = useCallback(
    async (roleCode) => {
      setIsLoading(true);
      setError(null);
      try {
        const nextRole = roleCode || null;
        setContextRole(nextRole);
        setActiveRoleState(nextRole);
        const data = await authApi.getMe();
        setUser(data.user);
        return data.user;
      } catch (err) {
        setError(err.message || 'Failed to switch role context');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const login = useCallback(
    async (credentials) => {
      setIsLoading(true);
      setError(null);
      try {
        setContextRole(null);
        setActiveRoleState(null);
        const data = await authApi.login(credentials);
        setUser(data.user);
        if (data.user?.permissions?.includes('CORE.CONTEXT.SWITCH')) {
          loadContextRoles();
        }
        return data.user;
      } catch (err) {
        setError(err.message || 'Authentication failed');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [loadContextRoles]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout request completed with warning:', err.message);
    } finally {
      setUser(null);
      setContextRole(null);
      setActiveRoleState(null);
      setAvailableContextRoles([]);
      setIsLoading(false);
    }
  }, []);

  const hasPermission = useCallback(
    (permissionCode) => {
      if (!user || !Array.isArray(user.permissions)) return false;
      return user.permissions.includes(permissionCode);
    },
    [user]
  );

  const hasAnyPermission = useCallback(
    (permissionCodes) => {
      if (!user || !Array.isArray(user.permissions)) return false;
      return permissionCodes.some((code) => user.permissions.includes(code));
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      roles: user?.roles || [],
      permissions: user?.permissions || [],
      isAuthenticated: Boolean(user),
      activeContextRole,
      availableContextRoles,
      canContextSwitch: Boolean(user?.canContextSwitch),
      isLoading,
      error,
      login,
      logout,
      refreshSession,
      switchContextRole,
      hasPermission,
      hasAnyPermission,
    }),
    [
      user,
      activeContextRole,
      availableContextRoles,
      isLoading,
      error,
      login,
      logout,
      refreshSession,
      switchContextRole,
      hasPermission,
      hasAnyPermission,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
