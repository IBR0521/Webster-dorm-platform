import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/api-guard';
import { resetSchedulePreservingAdmin } from '@/lib/server/schedule-reset';
import { loadScheduleForClient } from '@/lib/server/schedule-for-client';

export async function POST() {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  await resetSchedulePreservingAdmin();
  const data = await loadScheduleForClient();
  return NextResponse.json(data);
}
