import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/server/prisma';
import { hashPassword } from '@/lib/server/password';
import { createSessionCookie } from '@/lib/server/session';
import { userRowToUser } from '@/lib/server/schedule-repo';
import { databaseUnavailable } from '@/lib/server/api-guard';
import { generateId } from '@/lib/utils/helpers';
import {
  isSupabaseAuthUsersEnabled,
  supabaseAdminCreateUser,
  supabaseAdminDeleteUser,
} from '@/lib/server/supabase-auth-users';
import { allowRegisterAsAdmin } from '@/lib/server/registration-policy';
import { ensureBootstrapDevUsers } from '@/lib/server/bootstrap-dev-users';

const bodySchema = z.object({
  name: z.string().min(1),
  surname: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  roomNumber: z.string(),
  gender: z.enum(['male', 'female']),
  password: z.string().min(6),
  accountType: z.enum(['student', 'admin']).optional().default('student'),
});

export async function POST(req: Request) {
  const unavailable = databaseUnavailable();
  if (unavailable) return unavailable;

  try {
    await ensureBootstrapDevUsers();
  } catch (e) {
    console.error('ensureBootstrapDevUsers', e);
    return NextResponse.json({ error: 'Database is not ready. Run migrations or check DATABASE_URL.' }, { status: 503 });
  }

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
  const email = data.email.toLowerCase().trim();
  const canRegisterAsAdmin = allowRegisterAsAdmin();
  const wantsAdmin = data.accountType === 'admin';
  if (wantsAdmin && !canRegisterAsAdmin) {
    return NextResponse.json(
      { error: 'Admin registration is disabled on this deployment. Use a student account or contact an administrator.' },
      { status: 403 }
    );
  }
  const isAdmin = wantsAdmin && canRegisterAsAdmin;

  const roomTrimmed = data.roomNumber.trim();
  if (data.accountType === 'student' && !roomTrimmed) {
    return NextResponse.json({ error: 'Room number is required for student accounts' }, { status: 400 });
  }
  const roomNumber = isAdmin && !roomTrimmed ? '—' : roomTrimmed;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
  }

  const passwordHash = await hashPassword(data.password);

  let authUserId: string | null = null;
  if (isSupabaseAuthUsersEnabled()) {
    const created = await supabaseAdminCreateUser({
      email,
      password: data.password,
      name: data.name,
      surname: data.surname,
      phone: data.phone,
      roomNumber,
      gender: data.gender,
    });
    if ('error' in created) {
      const msg = created.error.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists')) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      }
      return NextResponse.json({ error: created.error }, { status: 400 });
    }
    authUserId = created.id;
  }

  const id = authUserId ?? generateId();

  let row;
  try {
    row = await prisma.user.create({
      data: {
        id,
        email,
        passwordHash,
        name: data.name,
        surname: data.surname,
        phone: data.phone,
        roomNumber,
        gender: data.gender,
        isAdmin,
      },
    });
  } catch (e) {
    if (authUserId) {
      await supabaseAdminDeleteUser(authUserId).catch(() => {});
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }
    throw e;
  }

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
