'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { initializeAdminAccount } from '@/lib/utils/initAdmin';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    initializeAdminAccount();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    startTransition(() => {
      // Send authenticated users to an in-app protected page.
      router.replace(isAuthenticated ? '/profile' : '/login');
    });
  }, [isAuthenticated, isLoading, router]);

  // Return empty while redirecting
  return <div />;
}
