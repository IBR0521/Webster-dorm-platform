'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import {
  getCurrentUser,
  setCurrentUser,
  getUsers,
  saveUsers,
} from '../utils/storage';
import { generateId } from '../utils/helpers';
import { initializeAdminAccount } from '../utils/initAdmin';
import { isDatabaseEnabled } from '../config/client';
import { toast } from 'sonner';
import { apiErrorMessage } from '../utils/api-error';

export type RegisterAccountType = 'student' | 'admin';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    userData: Omit<User, 'id' | 'isAdmin' | 'registeredAt'>,
    options?: { accountType?: RegisterAccountType }
  ) => Promise<boolean>;
  updateProfile: (
    updates: Partial<Pick<User, 'name' | 'surname' | 'phone' | 'roomNumber' | 'gender'>>
  ) => Promise<boolean>;
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

  const loadMeFromApi = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 12_000);
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
        signal: controller.signal,
      });
      if (!res.ok) {
        setCurrentUserState(null);
        return;
      }
      const data = (await res.json()) as { user: User };
      setCurrentUserState(data.user);
    } catch {
      setCurrentUserState(null);
    } finally {
      window.clearTimeout(timeoutId);
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      if (isDatabaseEnabled()) {
        await loadMeFromApi();
        setIsLoading(false);
        return;
      }

      initializeAdminAccount();
      const user = getCurrentUser();
      setCurrentUserState(user);
      setIsLoading(false);
    };
    void run();
  }, [loadMeFromApi]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (isDatabaseEnabled()) {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          toast.error(await apiErrorMessage(res));
          setIsLoading(false);
          return false;
        }
        const data = (await res.json()) as { user: User };
        setCurrentUserState(data.user);
        setIsLoading(false);
        return true;
      }

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
    userData: Omit<User, 'id' | 'isAdmin' | 'registeredAt'>,
    options?: { accountType?: RegisterAccountType }
  ): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (isDatabaseEnabled()) {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: userData.name,
            surname: userData.surname,
            email: userData.email,
            phone: userData.phone,
            roomNumber: userData.roomNumber,
            gender: userData.gender,
            password: userData.password,
            accountType: options?.accountType ?? 'student',
          }),
        });
        if (!res.ok) {
          toast.error(await apiErrorMessage(res));
          setIsLoading(false);
          return false;
        }
        const data = (await res.json()) as { user: User };
        setCurrentUserState(data.user);
        setIsLoading(false);
        return true;
      }

      const users = getUsers();
      if (users.some((u) => u.email === userData.email)) {
        setIsLoading(false);
        return false;
      }

      const newUser: User = {
        ...userData,
        id: generateId(),
        isAdmin: options?.accountType === 'admin',
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
    if (isDatabaseEnabled()) {
      void fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      return;
    }
    setCurrentUser(null);
  };

  const updateProfile = async (
    updates: Partial<Pick<User, 'name' | 'surname' | 'phone' | 'roomNumber' | 'gender'>>
  ): Promise<boolean> => {
    if (!currentUser) return false;

    setIsLoading(true);
    try {
      if (isDatabaseEnabled()) {
        const res = await fetch('/api/users/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updates),
        });
        if (!res.ok) {
          toast.error(await apiErrorMessage(res));
          setIsLoading(false);
          return false;
        }
        const data = (await res.json()) as { user: User };
        setCurrentUserState(data.user);
        setIsLoading(false);
        return true;
      }

      const users = getUsers();
      const updatedUser: User = { ...currentUser, ...updates };
      const updatedUsers = users.map((u) => (u.id === currentUser.id ? updatedUser : u));

      saveUsers(updatedUsers);
      setCurrentUser(updatedUser);
      setCurrentUserState(updatedUser);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Update profile error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const value: AuthContextType = {
    currentUser,
    isLoading,
    login,
    register,
    updateProfile,
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
