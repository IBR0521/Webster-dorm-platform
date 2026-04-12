import { NextResponse } from 'next/server';
import { databaseUnavailable, requireSessionUser } from '@/lib/server/api-guard';
import { prisma } from '@/lib/server/prisma';
import { userRowToUser } from '@/lib/server/schedule-repo';

/** Logged-in users: list all profiles for name resolution (laundry/gym/admin UI). No password fields. */
export async function GET() {
  const fail = databaseUnavailable();
  if (fail) return fail;

  const r = await requireSessionUser();
  if ('response' in r) return r.response;

  const rows = await prisma.user.findMany({
    orderBy: [{ isAdmin: 'asc' }, { roomNumber: 'asc' }, { surname: 'asc' }],
  });

  return NextResponse.json({ users: rows.map(userRowToUser) });
}
