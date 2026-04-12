import { prisma } from '@/lib/server/prisma';
import { hashPassword } from '@/lib/server/password';
import type { User } from '@prisma/client';
import { Prisma } from '@prisma/client';

function metaString(m: Record<string, unknown>, key: string, fallback: string): string {
  const v = m[key];
  return typeof v === 'string' && v.trim() ? v.trim() : fallback;
}

/** Emails that should get isAdmin on first profile row (Supabase-only admins). */
const BOOTSTRAP_ADMIN_EMAILS = new Set([
  'admin@webster.edu',
  'testadmin@webster.edu',
  'admin1@webster.edu',
  'admin2@webster.edu',
  'admin3@webster.edu',
]);

export async function ensureBootstrapAdminRole(row: User): Promise<User> {
  if (row.isAdmin) return row;
  if (!BOOTSTRAP_ADMIN_EMAILS.has(row.email.toLowerCase())) return row;
  return prisma.user.update({
    where: { id: row.id },
    data: { isAdmin: true },
  });
}

/**
 * Creates public."User" after Supabase Auth sign-in when the profile row is missing.
 * Password is unused for login (Auth handles that); bcrypt stores a random placeholder.
 */
export async function provisionAppUserFromSupabaseAuth(opts: {
  authUserId: string;
  email: string;
  userMetadata: Record<string, unknown>;
}) {
  const email = opts.email.toLowerCase().trim();
  const m = opts.userMetadata;
  const passwordHash = await hashPassword(`supabase-only:${crypto.randomUUID()}`);

  const existingProfile = await prisma.user.findFirst({
    where: { email: { equals: email, mode: 'insensitive' } },
  });
  if (existingProfile) {
    return existingProfile;
  }

  try {
    return await prisma.user.create({
      data: {
        id: opts.authUserId,
        email,
        passwordHash,
        name: metaString(m, 'name', 'Staff'),
        surname: metaString(m, 'surname', 'User'),
        phone: metaString(m, 'phone', '—'),
        roomNumber: metaString(m, 'room_number', '0'),
        gender: metaString(m, 'gender', 'male') === 'female' ? 'female' : 'male',
        isAdmin: BOOTSTRAP_ADMIN_EMAILS.has(email),
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      const byEmail = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
      });
      if (byEmail) return byEmail;
    }
    throw e;
  }
}
