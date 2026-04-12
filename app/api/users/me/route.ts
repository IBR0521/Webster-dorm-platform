import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/prisma';
import { userRowToUser } from '@/lib/server/schedule-repo';
import { invalidateSessionUserCache, requireSessionUser } from '@/lib/server/api-guard';

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  surname: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  roomNumber: z.string().min(1).optional(),
  gender: z.enum(['male', 'female']).optional(),
});

export async function PATCH(req: Request) {
  const r = await requireSessionUser();
  if ('response' in r) return r.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const row = await prisma.user.update({
    where: { id: r.dbUser.id },
    data: parsed.data,
  });

  invalidateSessionUserCache(r.dbUser.id);

  return NextResponse.json({ user: userRowToUser(row) });
}
