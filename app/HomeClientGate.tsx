'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { initializeAdminAccount } from '@/lib/utils/initAdmin';
import { PageLoading } from '@/components/PageLoading';

export function HomeClientGate() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    initializeAdminAccount();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const path = isAuthenticated ? '/dashboard' : '/login';
    router.replace(path);
  }, [isAuthenticated, isLoading, router]);

  return (
    <PageLoading
      fullScreen
      className="bg-background text-foreground"
      message={isLoading ? 'Checking your session…' : 'Taking you to the app…'}
    />
  );
}
