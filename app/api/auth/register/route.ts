import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/prisma';
import { hashPassword } from '@/lib/server/password';
import { createSessionCookie } from '@/lib/server/session';
import { userRowToUser } from '@/lib/server/schedule-repo';
import { databaseUnavailable } from '@/lib/server/api-guard';
import { generateId } from '@/lib/utils/helpers';

const bodySchema = z.object({
  name: z.string().min(1),
  surname: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  roomNumber: z.string().min(1),
  gender: z.enum(['male', 'female']),
  password: z.string().min(6),
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
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  }

  const passwordHash = await hashPassword(data.password);
  const id = generateId();

  const row = await prisma.user.create({
    data: {
      id,
      email: data.email,
      passwordHash,
      name: data.name,
      surname: data.surname,
      phone: data.phone,
      roomNumber: data.roomNumber,
      gender: data.gender,
      isAdmin: false,
    },
  });

  const user = userRowToUser(row);
  const cookie = await createSessionCookie(row.id);

  return NextResponse.json(
    { user },
    {
      status: 201,
      headers: { 'Set-Cookie': cookie },
    }
  );
}
