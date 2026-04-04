import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateId } from '../lib/utils/helpers';
import { createFreshSchedule } from '../lib/schedule/factory';
import { replaceFullSchedule } from '../lib/server/schedule-repo';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 10);
  const adminId = generateId();

  await prisma.user.upsert({
    where: { email: 'admin@webster.edu' },
    create: {
      id: adminId,
      email: 'admin@webster.edu',
      passwordHash,
      name: 'Admin',
      surname: 'Account',
      phone: '+1-555-0000',
      roomNumber: '999',
      gender: 'male',
      isAdmin: true,
    },
    update: {
      passwordHash,
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

  console.log('Seed done. Admin: admin@webster.edu / admin123');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
