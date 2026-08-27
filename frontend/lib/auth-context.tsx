'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
  badge_id?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedToken = localStorage.getItem('nfc_token');
    const storedUser = localStorage.getItem('nfc_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) return;
    
    const isAuthPage = pathname.endsWith('/login');
    
    if (!token && !isAuthPage) {
      router.push('/login');
    } else if (token && isAuthPage) {
      router.push('/logs');
    }
  }, [token, loading, pathname, router]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('nfc_token', newToken);
    localStorage.setItem('nfc_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    router.push('/logs');
  };

  const logout = () => {
    localStorage.removeItem('nfc_token');
    localStorage.removeItem('nfc_user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
