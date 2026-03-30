'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import {
  getCurrentUser,
  setCurrentUser,
  getUsers,
  saveUsers,
} from '../utils/storage';
import { generateId } from '../utils/helpers';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id' | 'isAdmin' | 'registeredAt'>) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize on mount
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUserState(user);
    setIsLoading(false);
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Mock authentication - in real app, this would call an API
      const users = getUsers();
      const user = users.find((u) => u.email === email && u.password === password);

      if (user) {
        setCurrentUserState(user);
        setCurrentUser(user);
        setIsLoading(false);
        return true;
      }
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const register = async (
    userData: Omit<User, 'id' | 'isAdmin' | 'registeredAt'>
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      const users = getUsers();

      // Check if user already exists
      if (users.some((u) => u.email === userData.email)) {
        setIsLoading(false);
        return false;
      }

      // Create new user
      const newUser: User = {
        ...userData,
        id: generateId(),
        isAdmin: false,
        registeredAt: new Date(),
      };

      users.push(newUser);
      saveUsers(users);
      setCurrentUserState(newUser);
      setCurrentUser(newUser);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = (): void => {
    setCurrentUserState(null);
    setCurrentUser(null);
  };

  const value: AuthContextType = {
    currentUser,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: currentUser !== null,
    isAdmin: currentUser?.isAdmin ?? false,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
