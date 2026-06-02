import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  login as loginApi,
  logout as logoutApi,
  signUp as signUpApi,
} from '../services/auth-service';
import { getProfile } from '../services/user-service';
import { parseApiError } from '../lib/api-client';
import { connectSocket, disconnectSocket } from '../lib/socket-client';

const AuthContext = createContext(null);

function normalizeUser(raw = {}) {
  return {
    ...raw,
    firstName: raw.firstName || raw.firstname || '',
    lastName: raw.lastName || raw.lastname || '',
    photoUrl: raw.photoUrl || raw.photoURL || raw.avatar || '',
    about: raw.about || '',
    skills: Array.isArray(raw.skills) ? raw.skills : [],
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await getProfile();
      setUser(normalizeUser(response?.data));
      return response?.data;
    } catch {
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    fetchProfile().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?._id || user?.id) {
      connectSocket({ userId: user._id || user.id });
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      async login(payload) {
        try {
          await loginApi(payload);
          await fetchProfile();
          return { ok: true };
        } catch (error) {
          return { ok: false, message: parseApiError(error) };
        }
      },
      async signUp(payload) {
        try {
          await signUpApi(payload);
          return { ok: true };
        } catch (error) {
          return { ok: false, message: parseApiError(error) };
        }
      },
      async logout() {
        await logoutApi();
        disconnectSocket();
        setUser(null);
      },
      async refreshUser() {
        await fetchProfile();
      },
      setUser,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
