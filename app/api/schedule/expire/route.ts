import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/server/api-guard';
import { runScheduleExpiry } from '@/lib/server/schedule-expire';
import { loadScheduleForClient } from '@/lib/server/schedule-for-client';

/** One atomic server pass: clear ended bookings + 24h kitchen expiry. */
export async function POST() {
  const r = await requireSessionUser();
  if ('response' in r) return r.response;

  const changed = await runScheduleExpiry();
  if (!changed) {
    return NextResponse.json({ ok: true });
  }
  const schedule = await loadScheduleForClient();
  return NextResponse.json({ ok: true, schedule });
}
