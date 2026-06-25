import React, { createContext, useState, useEffect, useCallback } from 'react';
import { api, setAccessToken } from '@/lib/api';
import type { LoginInput, TokenResponse } from '@cv-generator/shared';

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'staff';
}

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: try to refresh to restore session
  useEffect(() => {
    const tryRefresh = async () => {
      try {
        const { data } = await api.post<TokenResponse>('/auth/refresh');
        setAccessToken(data.accessToken);
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    tryRefresh();
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const { data } = await api.post<TokenResponse>('/auth/login', input);
    setAccessToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => null);
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
