import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/server/prisma';
import { gymRowToSlot } from '@/lib/server/schedule-repo';
import type { GymSlot } from '@/lib/types';
import { getGymBookedUserIds } from '@/lib/utils/helpers';
import type { GymSlotInput } from '@/lib/utils/helpers';

const DEFAULT_CAP = 10;

export async function gymBookWindow(
  slotIds: string[],
  userId: string
): Promise<GymSlot[]> {
  if (slotIds.length === 0) return [];

  return prisma.$transaction(
    async (tx) => {
      const rows = await tx.gymSlot.findMany({
        where: { id: { in: slotIds } },
      });
      const byId = new Map(rows.map((r) => [r.id, r]));
      const ordered = slotIds.map((id) => byId.get(id)).filter(Boolean) as typeof rows;
      if (ordered.length !== slotIds.length) {
        throw new Error('SLOT_NOT_FOUND');
      }

      const slots = ordered.map((r) => gymRowToSlot(r));
      const allCanJoin = slots.every((s) => {
        const ids = getGymBookedUserIds(s as GymSlotInput);
        const cap = s.capacity ?? DEFAULT_CAP;
        return ids.length < cap && !ids.includes(userId);
      });

      if (allCanJoin) {
        for (const s of slots) {
          const ids = [...getGymBookedUserIds(s as GymSlotInput), userId];
          const unique = [...new Set(ids)];
          await tx.gymSlot.update({
            where: { id: s.id },
            data: {
              bookedUserIds: JSON.stringify(unique),
            },
          });
        }
      } else {
        for (const s of slots) {
          const ids = getGymBookedUserIds(s as GymSlotInput);
          const cap = s.capacity ?? DEFAULT_CAP;
          const queue = [...(s.bookingQueue ?? [])];
          const full = ids.length >= cap;
          if (full && !ids.includes(userId) && !queue.includes(userId)) {
            queue.push(userId);
            await tx.gymSlot.update({
              where: { id: s.id },
              data: {
                bookingQueue: JSON.stringify(queue),
              },
            });
          }
        }
      }

      const refreshed = await tx.gymSlot.findMany({
        where: { id: { in: slotIds } },
      });
      return refreshed.map(gymRowToSlot);
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      timeout: 30_000,
    }
  );
}

export async function gymCancelWindow(
  slotIds: string[],
  userId: string
): Promise<GymSlot[]> {
  if (slotIds.length === 0) return [];

  return prisma.$transaction(
    async (tx) => {
      for (const slotId of slotIds) {
        const row = await tx.gymSlot.findUnique({ where: { id: slotId } });
        if (!row) continue;
        const s = gymRowToSlot(row);
        const cap = s.capacity ?? DEFAULT_CAP;
        let ids = [...getGymBookedUserIds(s as GymSlotInput)];
        let queue = [...(s.bookingQueue ?? [])];

        if (ids.includes(userId)) {
          ids = ids.filter((id) => id !== userId);
          while (ids.length < cap && queue.length > 0) {
            const next = queue.shift();
            if (next && !ids.includes(next)) {
              ids.push(next);
            }
          }
        } else if (queue.includes(userId)) {
          queue = queue.filter((id) => id !== userId);
        }

        await tx.gymSlot.update({
          where: { id: slotId },
          data: {
            bookedUserIds: JSON.stringify(ids),
            bookingQueue: JSON.stringify(queue),
          },
        });
      }

      const refreshed = await tx.gymSlot.findMany({
        where: { id: { in: slotIds } },
      });
      return refreshed.map(gymRowToSlot);
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      timeout: 30_000,
    }
  );
}
