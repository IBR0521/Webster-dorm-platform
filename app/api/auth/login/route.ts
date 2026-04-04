import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/prisma';
import { verifyPassword } from '@/lib/server/password';
import { createSessionCookie } from '@/lib/server/session';
import { userRowToUser } from '@/lib/server/schedule-repo';
import { databaseUnavailable } from '@/lib/server/api-guard';

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const unavailable = databaseUnavailable();
  if (unavailable) return unavailable;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const row = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!row) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const ok = await verifyPassword(parsed.data.password, row.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const user = userRowToUser(row);
  const cookie = await createSessionCookie(row.id);

  return NextResponse.json(
    { user },
    {
      headers: { 'Set-Cookie': cookie },
    }
  );
}
