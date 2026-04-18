'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useEffect } from 'react';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import { PageLoading } from '@/components/PageLoading';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <PageLoading message="Checking your session…" fullScreen />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavigation />
      <main className="pt-20 md:pt-0 md:ml-64">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
