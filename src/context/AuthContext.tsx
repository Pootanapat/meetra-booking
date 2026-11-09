import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types/booking';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string) => void;
  logout: () => void;
}

const mockUser: User = {
  id: 'usr_001',
  name: 'สมชาย สายจอง (นิสิต KMITL)',
  email: 'somchai@kmitl.ac.th',
  role: 'student'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(mockUser);

  const login = (email: string) => {
    setUser({ ...mockUser, email });
  };

  const logout = () => {
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