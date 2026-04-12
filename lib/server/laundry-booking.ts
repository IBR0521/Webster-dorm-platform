import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/server/prisma';
import { laundryRowToSlot } from '@/lib/server/schedule-repo';
import type { LaundrySlot } from '@/lib/types';

export async function laundryBookWindow(
  slotIds: string[],
  userId: string
): Promise<LaundrySlot[]> {
  if (slotIds.length === 0) return [];

  return prisma.$transaction(
    async (tx) => {
      const rows = await tx.laundrySlot.findMany({
        where: { id: { in: slotIds } },
      });
      const byId = new Map(rows.map((r) => [r.id, r]));
      const ordered = slotIds.map((id) => byId.get(id)).filter(Boolean) as typeof rows;
      if (ordered.length !== slotIds.length) {
        throw new Error('SLOT_NOT_FOUND');
      }

      const slots = ordered.map((r) => laundryRowToSlot(r));
      const allFree = slots.every(
        (s) => !s.bookedBy && (s.bookingQueue?.length ?? 0) === 0
      );

      if (allFree) {
        for (const s of slots) {
          await tx.laundrySlot.update({
            where: { id: s.id },
            data: {
              bookedById: userId,
              bookingQueue: JSON.stringify([]),
            },
          });
        }
      } else {
        for (const s of slots) {
          const bookedBy = s.bookedBy ?? null;
          const q = [...(s.bookingQueue ?? [])];
          if (bookedBy && bookedBy !== userId && !q.includes(userId)) {
            q.push(userId);
            await tx.laundrySlot.update({
              where: { id: s.id },
              data: {
                bookedById: bookedBy,
                bookingQueue: JSON.stringify(q),
              },
            });
          }
        }
      }

      const refreshed = await tx.laundrySlot.findMany({
        where: { id: { in: slotIds } },
      });
      return refreshed.map(laundryRowToSlot);
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      timeout: 30_000,
    }
  );
}

export async function laundryCancelWindow(
  slotIds: string[],
  userId: string
): Promise<LaundrySlot[]> {
  if (slotIds.length === 0) return [];

  return prisma.$transaction(
    async (tx) => {
      for (const slotId of slotIds) {
        const row = await tx.laundrySlot.findUnique({ where: { id: slotId } });
        if (!row) continue;
        const s = laundryRowToSlot(row);
        let nextBooked: string | null = s.bookedBy ?? null;
        let nextQueue = [...(s.bookingQueue ?? [])];

        if (s.bookedBy === userId) {
          if (nextQueue.length > 0) {
            const [next, ...rest] = nextQueue;
            nextBooked = next;
            nextQueue = rest;
          } else {
            nextBooked = null;
            nextQueue = [];
          }
        } else if (nextQueue.includes(userId)) {
          nextQueue = nextQueue.filter((id) => id !== userId);
        }

        await tx.laundrySlot.update({
          where: { id: slotId },
          data: {
            bookedById: nextBooked,
            bookingQueue: JSON.stringify(nextQueue),
          },
        });
      }

      const refreshed = await tx.laundrySlot.findMany({
        where: { id: { in: slotIds } },
      });
      return refreshed.map(laundryRowToSlot);
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      timeout: 30_000,
    }
  );
}
