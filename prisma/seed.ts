import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateId } from '../lib/utils/helpers';
import { createFreshSchedule } from '../lib/schedule/factory';
import { replaceFullSchedule } from '../lib/server/schedule-repo';

const prisma = new PrismaClient();

async function main() {
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const testAdminPasswordHash = await bcrypt.hash('testadmin123', 10);
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

  const count = await prisma.laundrySlot.count();
  if (count === 0) {
    const fresh = createFreshSchedule();
    await replaceFullSchedule({
      laundrySlots: fresh.laundrySlots,
      gymSlots: fresh.gymSlots,
      cleanDuties: fresh.cleanDuties,
      adminComments: [],
      studentComments: [],
    });
    console.log('Seeded laundry, gym, and kitchen duty slots.');
  }

  console.log('Seed done.');
  console.log('  Admin:     admin@webster.edu / admin123');
  console.log('  Test admin: testadmin@webster.edu / testadmin123');
  console.log('If you use Supabase Auth, create matching users there or sign in once to sync.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
