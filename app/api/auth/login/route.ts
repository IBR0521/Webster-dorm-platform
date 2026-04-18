import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/server/prisma';
import { verifyPassword } from '@/lib/server/password';
import { createSessionCookie } from '@/lib/server/session';
import { userRowToUser } from '@/lib/server/schedule-repo';
import { databaseUnavailable } from '@/lib/server/api-guard';
import {
  isSupabaseAuthUsersEnabled,
  supabaseSignInWithPassword,
} from '@/lib/server/supabase-auth-users';
import {
  ensureBootstrapAdminRole,
  provisionAppUserFromSupabaseAuth,
} from '@/lib/server/auth-provision';
import { ensureBootstrapDevUsers } from '@/lib/server/bootstrap-dev-users';

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const normalizedEmail = parsed.data.email.toLowerCase().trim();
  const password = parsed.data.password;

  if (isSupabaseAuthUsersEnabled()) {
    const auth = await supabaseSignInWithPassword(normalizedEmail, password);
    if (!('error' in auth)) {
      let row =
        (await prisma.user.findUnique({ where: { id: auth.userId } })) ??
        (await prisma.user.findFirst({
          where: { email: { equals: auth.email, mode: 'insensitive' } },
        }));

      if (!row) {
        try {
          row = await provisionAppUserFromSupabaseAuth({
            authUserId: auth.userId,
            email: auth.email,
            userMetadata: auth.userMetadata,
          });
        } catch (e) {
          console.error('provisionAppUserFromSupabaseAuth', e);
        }
      }

      if (row) {
        row = await ensureBootstrapAdminRole(row);
        const user = userRowToUser(row);
        const cookie = await createSessionCookie(row.id);
        return NextResponse.json({ user }, { headers: { 'Set-Cookie': cookie } });
      }
    }
  }

  const row = await prisma.user.findFirst({
    where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
  });
  if (!row) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const ok = await verifyPassword(password, row.passwordHash);
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
