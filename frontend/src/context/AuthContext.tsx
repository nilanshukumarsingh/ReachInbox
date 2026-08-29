import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email?: string, password?: string) => Promise<void>;
  googleLogin: (userData: { email: string; name: string; avatar?: string; googleId?: string }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authService.getStoredUser());
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const data = await authService.getMe();
      setUser(data);
      localStorage.setItem('reachinbox_user', JSON.stringify(data));
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const stored = authService.getStoredUser();
      if (stored) {
        setUser(stored);
      } else {
        // Default login as Figma mock user
        try {
          const res = await authService.login('oliver.brown@domain.io');
          setUser(res.user);
        } catch {
          // Ignore
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email?: string, password?: string) => {
    const res = await authService.login(email, password);
    setUser(res.user);
  };

  const googleLogin = async (userData: { email: string; name: string; avatar?: string; googleId?: string }) => {
    const res = await authService.googleLogin(userData);
    setUser(res.user);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
