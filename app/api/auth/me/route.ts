import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/server/api-guard';

export async function GET() {
  const r = await requireSessionUser();
  if ('response' in r) return r.response;
  return NextResponse.json({ user: r.user });
}
