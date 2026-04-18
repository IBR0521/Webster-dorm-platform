import { redirect } from 'next/navigation';
import { getSessionUserId } from '@/lib/server/session';
import { HomeClientGate } from './HomeClientGate';

export default async function HomePage() {
  if (process.env.NEXT_PUBLIC_DATABASE_ENABLED === '1') {
    const userId = await getSessionUserId();
    redirect(userId ? '/dashboard' : '/login');
  }

  return <HomeClientGate />;
}
