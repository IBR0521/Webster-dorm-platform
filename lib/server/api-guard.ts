import { NextResponse } from 'next/server';
import type { User as PrismaUserRow } from '@prisma/client';
import { prisma } from '@/lib/server/prisma';
import { getSessionUserId } from '@/lib/server/session';
import { userRowToUser } from '@/lib/server/schedule-repo';
import type { User } from '@/lib/types';

/** Short TTL: cuts one DB round-trip per burst of API calls (bookings, etc.). */
const SESSION_USER_CACHE_MS = 20_000;
const sessionUserCache = new Map<string, { row: PrismaUserRow; expiresAt: number }>();

export function invalidateSessionUserCache(userId: string): void {
  sessionUserCache.delete(userId);
}

export function databaseUnavailable(): NextResponse | null {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: 'DATABASE_URL is not set. Add it to .env.local (see .env.example).' },
      { status: 503 }
    );
  }
  return null;
}

export async function requireSessionUser(): Promise<
  | { user: User; dbUser: { id: string; isAdmin: boolean } }
  | { response: NextResponse }
> {
  const fail = databaseUnavailable();
  if (fail) return { response: fail };

  const userId = await getSessionUserId();
  if (!userId) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const now = Date.now();
  const cached = sessionUserCache.get(userId);
  let row: PrismaUserRow | null =
    cached && cached.expiresAt > now ? cached.row : null;

  if (!row) {
    row = await prisma.user.findUnique({ where: { id: userId } });
    if (row) {
      sessionUserCache.set(userId, { row, expiresAt: now + SESSION_USER_CACHE_MS });
    }
  }

  if (!row) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  return {
    user: userRowToUser(row),
    dbUser: { id: row.id, isAdmin: row.isAdmin },
  };
}

export async function requireAdmin(): Promise<
  | { user: User; dbUser: { id: string; isAdmin: boolean } }
  | { response: NextResponse }
> {
  const r = await requireSessionUser();
  if ('response' in r) return r;
  if (!r.dbUser.isAdmin) {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return r;
}
