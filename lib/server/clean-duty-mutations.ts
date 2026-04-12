import { prisma } from '@/lib/server/prisma';
import { dutyRowToDuty } from '@/lib/server/schedule-repo';
import { deleteStorageObjects } from '@/lib/server/supabase-storage';
import { parseJsonArray } from '@/lib/server/schedule-repo';

export async function getCleanDutyRowOrThrow(dutyId: string) {
  return prisma.cleanDuty.findUniqueOrThrow({ where: { id: dutyId } });
}

export async function approveCleanDuty(dutyId: string) {
  await prisma.cleanDuty.update({
    where: { id: dutyId },
    data: { status: 'approved' },
  });
  const row = await prisma.cleanDuty.findUniqueOrThrow({ where: { id: dutyId } });
  return dutyRowToDuty(row);
}

export async function rejectCleanDuty(dutyId: string) {
  const row = await prisma.cleanDuty.findUnique({ where: { id: dutyId } });
  if (!row) return null;
  const duty = dutyRowToDuty(row);
  if (duty.photoUrls?.length) {
    await deleteStorageObjects(duty.photoUrls);
  }
  await prisma.cleanDuty.update({
    where: { id: dutyId },
    data: { status: 'rejected', photoUrls: null },
  });
  const next = await prisma.cleanDuty.findUniqueOrThrow({ where: { id: dutyId } });
  return dutyRowToDuty(next);
}

export async function assignCleanDutyUsers(
  dutyId: string,
  userIds: string[],
  roomNumber?: string
) {
  const row = await prisma.cleanDuty.findUniqueOrThrow({ where: { id: dutyId } });
  const floor = row.kitchenFloor ?? null;
  const assignedRoom =
    roomNumber && floor != null
      ? `Floor ${floor} Kitchen - Room ${roomNumber}`
      : row.assignedRoom;

  await prisma.cleanDuty.update({
    where: { id: dutyId },
    data: {
      assignedUsers: JSON.stringify(userIds),
      assignedRoomNumber: roomNumber ?? null,
      assignedRoom,
    },
  });
  const next = await prisma.cleanDuty.findUniqueOrThrow({ where: { id: dutyId } });
  return dutyRowToDuty(next);
}

export async function setCleanDutyPhotoPayload(
  dutyId: string,
  photoUrls: string[],
  submittedAt: Date
) {
  await prisma.cleanDuty.update({
    where: { id: dutyId },
    data: {
      photoUrls:
        photoUrls.length > 0 ? JSON.stringify(photoUrls) : null,
      status: 'pending',
      submittedAt,
    },
  });
  const next = await prisma.cleanDuty.findUniqueOrThrow({ where: { id: dutyId } });
  return dutyRowToDuty(next);
}

export function userIsAssignedToDuty(row: { assignedUsers: string }, userId: string): boolean {
  return parseJsonArray(row.assignedUsers).includes(userId);
}
