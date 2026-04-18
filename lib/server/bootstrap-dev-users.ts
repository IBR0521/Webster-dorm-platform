import { prisma } from '@/lib/server/prisma';
import { hashPassword } from '@/lib/server/password';
import { generateId } from '@/lib/utils/helpers';

/**
 * Ensures default dev admin rows exist (same as prisma/seed users).
 * Runs once per server process in development, or in production when WEBSTER_BOOTSTRAP_ADMIN=1.
 */
let bootstrapOnce: Promise<void> | null = null;

function shouldBootstrap(): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  return process.env.WEBSTER_BOOTSTRAP_ADMIN === '1';
}

async function run(): Promise<void> {
  const adminPasswordHash = await hashPassword('admin123');
  const testAdminPasswordHash = await hashPassword('testadmin123');
  const adminId = generateId();
  const testAdminId = generateId();

  await prisma.user.upsert({
    where: { email: 'admin@webster.edu' },
    create: {
      id: adminId,
      email: 'admin@webster.edu',
      passwordHash: adminPasswordHash,
      name: 'Admin',
      surname: 'Account',
      phone: '+1-555-0000',
      roomNumber: '999',
      gender: 'male',
      isAdmin: true,
    },
    update: {
      passwordHash: adminPasswordHash,
      isAdmin: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'testadmin@webster.edu' },
    create: {
      id: testAdminId,
      email: 'testadmin@webster.edu',
      passwordHash: testAdminPasswordHash,
      name: 'Test',
      surname: 'Admin',
      phone: '+1-555-0001',
      roomNumber: '998',
      gender: 'male',
      isAdmin: true,
    },
    update: {
      passwordHash: testAdminPasswordHash,
      isAdmin: true,
    },
  });
}

export function ensureBootstrapDevUsers(): Promise<void> {
  if (!shouldBootstrap()) {
    return Promise.resolve();
  }
  bootstrapOnce ??= run().catch((e) => {
    bootstrapOnce = null;
    throw e;
  });
  return bootstrapOnce;
}
