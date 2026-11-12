import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../types/booking';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getStoredUser(): User | null {
  const rawUser = localStorage.getItem('kmitlCurrentUser');
  if (!rawUser) return null;

  const storedUser: Partial<User> = JSON.parse(rawUser);
  if (!storedUser.email || !storedUser.name) {
    throw new TypeError('Stored user must have a name and email');
  }
  return {
    id: storedUser.id || storedUser.email,
    name: storedUser.name,
    email: storedUser.email,
    role: storedUser.role || 'student',
  };
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getStoredUser);

  useEffect(() => {
    const syncUser = () => setUser(getStoredUser());
    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener('storage', syncUser);
  }, []);

  const login = (email: string) => {
    const users: Partial<User>[] = JSON.parse(localStorage.getItem('kmitlUsers') || '[]');
    const account = users.find(candidate => candidate.email === email);
    if (!account || !account.name || !account.email) {
      throw new Error('No registered user found for this email');
    }

    const nextUser: User = {
      id: account.id || account.email,
      name: account.name,
      email: account.email,
      role: account.role || 'student',
    };
    localStorage.setItem('kmitlCurrentUser', JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem('kmitlCurrentUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};