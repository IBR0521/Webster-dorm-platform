import type { AdminComment } from '@/lib/types';
import { createFreshSchedule } from '@/lib/schedule/factory';
import { prisma } from '@/lib/server/prisma';
import { replaceFullSchedule } from '@/lib/server/schedule-repo';

export async function resetSchedulePreservingAdmin(): Promise<void> {
  const existing = await prisma.adminComment.findMany();
  const adminComments: AdminComment[] = existing.map((c) => ({
    id: c.id,
    targetId: c.targetId,
    targetType: c.targetType as AdminComment['targetType'],
    authorId: c.authorId,
    content: c.content,
    createdAt: c.createdAt,
    visibility: c.visibility as AdminComment['visibility'],
  }));

  const fresh = createFreshSchedule();
  await replaceFullSchedule({
    laundrySlots: fresh.laundrySlots,
    gymSlots: fresh.gymSlots,
    cleanDuties: fresh.cleanDuties,
    adminComments,
    studentComments: [],
  });
}
