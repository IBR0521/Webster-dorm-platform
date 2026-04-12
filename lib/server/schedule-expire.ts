import { prisma } from '@/lib/server/prisma';
import {
  laundryRowToSlot,
  gymRowToSlot,
  dutyRowToDuty,
} from '@/lib/server/schedule-repo';
import {
  getGymBookedUserIds,
  isKitchenSubmissionExpired,
  isTimePast,
} from '@/lib/utils/helpers';
import type { GymSlotInput } from '@/lib/utils/helpers';

/**
 * Clears ended laundry/gym bookings and 24h-expired kitchen submissions (+ related comments).
 * Returns true if anything changed (caller may skip a full schedule reload).
 */
export async function runScheduleExpiry(): Promise<boolean> {
  let changed = false;

  const laundryRows = await prisma.laundrySlot.findMany({
    where: {
      OR: [{ bookedById: { not: null } }, { NOT: { bookingQueue: '[]' } }],
    },
  });
  const laundryClearIds: string[] = [];
  for (const row of laundryRows) {
    const s = laundryRowToSlot(row);
    const has =
      Boolean(s.bookedBy) || (s.bookingQueue && s.bookingQueue.length > 0);
    if (has && isTimePast(s.date, s.endTime)) {
      laundryClearIds.push(s.id);
    }
  }
  if (laundryClearIds.length > 0) {
    await prisma.laundrySlot.updateMany({
      where: { id: { in: laundryClearIds } },
      data: { bookedById: null, bookingQueue: '[]' },
    });
    changed = true;
  }

  const gymRows = await prisma.gymSlot.findMany({
    where: {
      OR: [{ NOT: { bookedUserIds: '[]' } }, { NOT: { bookingQueue: '[]' } }],
    },
  });
  const gymClearIds: string[] = [];
  for (const row of gymRows) {
    const s = gymRowToSlot(row);
    const ids = getGymBookedUserIds(s as GymSlotInput);
    const hasQueue = (s.bookingQueue?.length ?? 0) > 0;
    if ((ids.length > 0 || hasQueue) && isTimePast(s.date, s.endTime)) {
      gymClearIds.push(s.id);
    }
  }
  if (gymClearIds.length > 0) {
    await prisma.gymSlot.updateMany({
      where: { id: { in: gymClearIds } },
      data: { bookedUserIds: '[]', bookingQueue: '[]' },
    });
    changed = true;
  }

  const duties = await prisma.cleanDuty.findMany({
    where: { submittedAt: { not: null } },
  });
  const expiredIds: string[] = [];
  for (const row of duties) {
    const duty = dutyRowToDuty(row);
    if (isKitchenSubmissionExpired(duty)) {
      expiredIds.push(duty.id);
    }
  }

  if (expiredIds.length > 0) {
    await prisma.$transaction(
      async (tx) => {
        await tx.cleanDuty.updateMany({
          where: { id: { in: expiredIds } },
          data: {
            photoUrls: null,
            submittedAt: null,
            status: 'pending',
          },
        });
        await tx.studentComment.deleteMany({
          where: { dutyId: { in: expiredIds } },
        });
        await tx.adminComment.deleteMany({
          where: {
            targetId: { in: expiredIds },
            targetType: { in: ['duty', 'submission'] },
          },
        });
      },
      { timeout: 60_000 }
    );
    changed = true;
  }

  return changed;
}
