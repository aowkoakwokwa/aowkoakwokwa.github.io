'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import jwt from 'jsonwebtoken';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  user: string | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    try {
      const token = Cookies.get('token') ?? null;
      console.log('dari auth', token);
      if (token) {
        // const decoded: any = jwtDecode(token);
        // const isExpired = decoded.exp * 1000 < Date.now();
        // if (isExpired) {
        //   Cookies.remove('token');
        //   setUser(null);
        // } else {
        //   setUser(token);
        // }
        // const isExpired = jwt.verify(
        //   token,
        //   process.env.SECRET_KEY || '',
        //   function (err: any, decoded: any) {
        //     if (err) {
        //       Cookies.remove('token');
        //       setUser(null);
        //       throw new Error('Token expired');
        //     }
        //   },
        // );
      }
    } catch (err) {
      console.error('Invalid token:', err);
      // Cookies.remove('token');
      setUser(null);
    }
  }, []);

  async function login(username: string, password: string) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      setToken(data.token);
      setUser(data.token);
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  const logout = () => {
    setUser(null);
    Cookies.remove('token');
  };

  return (
    <AuthContext.Provider value={{ user, error, loading, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
