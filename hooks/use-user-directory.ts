'use client';

import { useCallback, useEffect, useState } from 'react';
import type { User } from '@/lib/types';
import { useAuth } from '@/lib/context/AuthContext';
import { isDatabaseEnabled } from '@/lib/config/client';
import { getUsers } from '@/lib/utils/storage';

function normalizeUser(u: User): User {
  const ra = u.registeredAt as unknown;
  return {
    ...u,
    registeredAt: ra instanceof Date ? ra : new Date(String(ra)),
  };
}

/**
 * All registered users for resolving names (bookings, admin tools).
 * In DB mode, loads from `/api/users/directory`; otherwise localStorage.
 */
export function useUserDirectory(): { users: User[]; refetch: () => void } {
  const { currentUser, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [nonce, setNonce] = useState(0);
  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (authLoading) return;
    if (!currentUser) {
      setUsers([]);
      return;
    }
    if (!isDatabaseEnabled()) {
      setUsers(getUsers().map(normalizeUser));
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/users/directory', { credentials: 'include' });
        if (!res.ok) return;
        const data = (await res.json()) as { users?: User[] };
        if (cancelled || !data.users) return;
        setUsers(data.users.map(normalizeUser));
      } catch {
        if (!cancelled) setUsers([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, currentUser?.id, nonce]);

  return { users, refetch };
}
