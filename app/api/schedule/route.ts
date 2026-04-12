import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/server/api-guard';
import { loadScheduleForClient } from '@/lib/server/schedule-for-client';

export async function GET() {
  const r = await requireSessionUser();
  if ('response' in r) return r.response;

  try {
    const data = await loadScheduleForClient();
    return NextResponse.json(data);
  } catch (e) {
    console.error('GET /api/schedule', e);
    const message =
      e instanceof Error ? e.message : 'Failed to load schedule';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
