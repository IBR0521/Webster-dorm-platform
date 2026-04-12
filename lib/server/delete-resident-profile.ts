import { prisma } from '@/lib/server/prisma';
import {
  laundryRowToSlot,
  gymRowToSlot,
  parseJsonArray,
} from '@/lib/server/schedule-repo';
import { getGymBookedUserIds } from '@/lib/utils/helpers';
import type { GymSlotInput } from '@/lib/utils/helpers';

const GYM_DEFAULT_CAP = 10;

/**
 * Removes a non-admin user from the app DB: strips them from laundry/gym/duty JSON fields,
 * deletes their comments, then deletes the User row. Supabase Auth is separate — delete there
 * or call supabaseAdminDeleteUser from the route after this succeeds.
 */
export async function deleteResidentProfile(targetUserId: string): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      const laundryRows = await tx.laundrySlot.findMany();
      for (const row of laundryRows) {
        const s = laundryRowToSlot(row);
        let nextBooked: string | null = s.bookedBy ?? null;
        let nextQueue = [...(s.bookingQueue ?? [])];
        let touched = false;

        if (s.bookedBy === targetUserId) {
          touched = true;
          if (nextQueue.length > 0) {
            const [next, ...rest] = nextQueue;
            nextBooked = next;
            nextQueue = rest;
          } else {
            nextBooked = null;
            nextQueue = [];
          }
        } else if (nextQueue.includes(targetUserId)) {
          touched = true;
          nextQueue = nextQueue.filter((id) => id !== targetUserId);
        }

        if (touched) {
          await tx.laundrySlot.update({
            where: { id: row.id },
            data: {
              bookedById: nextBooked,
              bookingQueue: JSON.stringify(nextQueue),
            },
          });
        }
      }

      const gymRows = await tx.gymSlot.findMany();
      for (const row of gymRows) {
        const s = gymRowToSlot(row);
        const cap = s.capacity ?? GYM_DEFAULT_CAP;
        let ids = [...getGymBookedUserIds(s as GymSlotInput)];
        let queue = [...(s.bookingQueue ?? [])];
        let touched = false;

        if (ids.includes(targetUserId)) {
          touched = true;
          ids = ids.filter((id) => id !== targetUserId);
          while (ids.length < cap && queue.length > 0) {
            const next = queue.shift();
            if (next && !ids.includes(next)) ids.push(next);
          }
        } else if (queue.includes(targetUserId)) {
          touched = true;
          queue = queue.filter((id) => id !== targetUserId);
        }

        if (touched) {
          await tx.gymSlot.update({
            where: { id: row.id },
            data: {
              bookedUserIds: JSON.stringify(ids),
              bookingQueue: JSON.stringify(queue),
            },
          });
        }
      }

      const duties = await tx.cleanDuty.findMany();
      for (const row of duties) {
        const assigned = parseJsonArray(row.assignedUsers);
        if (!assigned.includes(targetUserId)) continue;
        await tx.cleanDuty.update({
          where: { id: row.id },
          data: {
            assignedUsers: JSON.stringify(assigned.filter((id) => id !== targetUserId)),
          },
        });
      }

      await tx.studentComment.deleteMany({ where: { authorId: targetUserId } });
      await tx.adminComment.deleteMany({ where: { authorId: targetUserId } });

      await tx.user.delete({ where: { id: targetUserId } });
    },
    { timeout: 120_000 }
  );
}
