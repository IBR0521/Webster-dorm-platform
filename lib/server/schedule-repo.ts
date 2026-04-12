import type {
  AdminComment,
  CleanDuty,
  GymSlot,
  LaundrySlot,
  StudentComment,
  User,
} from '@/lib/types';
import { prisma } from '@/lib/server/prisma';
import { createFreshSchedule } from '@/lib/schedule/factory';

export function parseJsonArray(raw: string): string[] {
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function parseOptionalJsonArray(raw: string | null): string[] | undefined {
  if (raw == null || raw === '') return undefined;
  const arr = parseJsonArray(raw);
  return arr.length ? arr : [];
}

export function laundryRowToSlot(row: {
  id: string;
  launderyNumber: number;
  startTime: string;
  endTime: string;
  date: string;
  bookedById: string | null;
  bookingQueue: string;
  gender: string;
  capacity: number;
}): LaundrySlot {
  return {
    id: row.id,
    launderyNumber: row.launderyNumber,
    startTime: row.startTime,
    endTime: row.endTime,
    date: row.date,
    bookedBy: row.bookedById ?? undefined,
    bookingQueue: parseJsonArray(row.bookingQueue),
    gender: row.gender as LaundrySlot['gender'],
    capacity: row.capacity,
  };
}

export function gymRowToSlot(row: {
  id: string;
  startTime: string;
  endTime: string;
  date: string;
  bookedUserIds: string;
  bookingQueue: string;
  capacity: number;
}): GymSlot {
  const ids = parseJsonArray(row.bookedUserIds);
  return {
    id: row.id,
    startTime: row.startTime,
    endTime: row.endTime,
    date: row.date,
    bookedUserIds: ids.length ? ids : undefined,
    bookingQueue: parseJsonArray(row.bookingQueue),
    capacity: row.capacity,
  };
}

export function dutyRowToDuty(row: {
  id: string;
  assignedRoom: string;
  kitchenFloor: number | null;
  assignedRoomNumber: string | null;
  assignedUsers: string;
  date: string;
  photoUrls: string | null;
  status: string;
  submittedAt: Date | null;
}): CleanDuty {
  const users = parseJsonArray(row.assignedUsers);
  const photos = parseOptionalJsonArray(row.photoUrls);
  return {
    id: row.id,
    assignedRoom: row.assignedRoom,
    kitchenFloor: row.kitchenFloor ?? undefined,
    assignedRoomNumber: row.assignedRoomNumber ?? undefined,
    assignedUsers: users,
    date: row.date,
    photoUrls: photos,
    status: row.status as CleanDuty['status'],
    submittedAt: row.submittedAt ?? undefined,
  };
}

export function userRowToUser(row: {
  id: string;
  email: string;
  name: string;
  surname: string;
  phone: string;
  roomNumber: string;
  gender: string;
  isAdmin: boolean;
  registeredAt: Date;
}): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    surname: row.surname,
    phone: row.phone,
    roomNumber: row.roomNumber,
    gender: row.gender as User['gender'],
    password: '',
    isAdmin: row.isAdmin,
    registeredAt: row.registeredAt,
  };
}

export async function loadFullSchedule(): Promise<{
  laundrySlots: LaundrySlot[];
  gymSlots: GymSlot[];
  cleanDuties: CleanDuty[];
  adminComments: AdminComment[];
  studentComments: StudentComment[];
}> {
  let [laundry, gym, duties, admin, student] = await Promise.all([
    prisma.laundrySlot.findMany(),
    prisma.gymSlot.findMany(),
    prisma.cleanDuty.findMany(),
    prisma.adminComment.findMany(),
    prisma.studentComment.findMany(),
  ]);

  const nothingScheduledYet =
    laundry.length === 0 &&
    gym.length === 0 &&
    duties.length === 0 &&
    admin.length === 0 &&
    student.length === 0;

  if (nothingScheduledYet) {
    const fresh = createFreshSchedule();
    await replaceFullSchedule({
      laundrySlots: fresh.laundrySlots,
      gymSlots: fresh.gymSlots,
      cleanDuties: fresh.cleanDuties,
      adminComments: [],
      studentComments: [],
    });
    [laundry, gym, duties, admin, student] = await Promise.all([
      prisma.laundrySlot.findMany(),
      prisma.gymSlot.findMany(),
      prisma.cleanDuty.findMany(),
      prisma.adminComment.findMany(),
      prisma.studentComment.findMany(),
    ]);
  }

  return {
    laundrySlots: laundry.map(laundryRowToSlot),
    gymSlots: gym.map(gymRowToSlot),
    cleanDuties: duties.map(dutyRowToDuty),
    adminComments: admin.map((c) => ({
      id: c.id,
      targetId: c.targetId,
      targetType: c.targetType as AdminComment['targetType'],
      authorId: c.authorId,
      content: c.content,
      createdAt: c.createdAt,
      visibility: c.visibility as AdminComment['visibility'],
    })),
    studentComments: student.map((c) => ({
      id: c.id,
      dutyId: c.dutyId ?? undefined,
      commentType: (c.commentType ?? undefined) as StudentComment['commentType'],
      authorId: c.authorId,
      content: c.content,
      createdAt: c.createdAt,
    })),
  };
}

/** Auto-seed inserts thousands of rows; default Prisma interactive tx timeout (5s) is too low over pooler. */
const REPLACE_SCHEDULE_TX_MS = 120_000;

export async function replaceFullSchedule(input: {
  laundrySlots: LaundrySlot[];
  gymSlots: GymSlot[];
  cleanDuties: CleanDuty[];
  adminComments: AdminComment[];
  studentComments: StudentComment[];
}): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.laundrySlot.deleteMany();
    await tx.gymSlot.deleteMany();
    await tx.cleanDuty.deleteMany();
    await tx.adminComment.deleteMany();
    await tx.studentComment.deleteMany();

    if (input.laundrySlots.length) {
      await tx.laundrySlot.createMany({
        data: input.laundrySlots.map((s) => ({
          id: s.id,
          launderyNumber: s.launderyNumber,
          startTime: s.startTime,
          endTime: s.endTime,
          date: s.date,
          bookedById: s.bookedBy ?? null,
          bookingQueue: JSON.stringify(s.bookingQueue ?? []),
          gender: s.gender,
          capacity: s.capacity,
        })),
      });
    }

    if (input.gymSlots.length) {
      await tx.gymSlot.createMany({
        data: input.gymSlots.map((s) => ({
          id: s.id,
          startTime: s.startTime,
          endTime: s.endTime,
          date: s.date,
          bookedUserIds: JSON.stringify(s.bookedUserIds ?? []),
          bookingQueue: JSON.stringify(s.bookingQueue ?? []),
          capacity: s.capacity,
        })),
      });
    }

    if (input.cleanDuties.length) {
      await tx.cleanDuty.createMany({
        data: input.cleanDuties.map((d) => ({
          id: d.id,
          assignedRoom: d.assignedRoom,
          kitchenFloor: d.kitchenFloor ?? null,
          assignedRoomNumber: d.assignedRoomNumber ?? null,
          assignedUsers: JSON.stringify(d.assignedUsers ?? []),
          date: d.date,
          photoUrls:
            d.photoUrls && d.photoUrls.length > 0 ? JSON.stringify(d.photoUrls) : null,
          status: d.status,
          submittedAt: d.submittedAt ? new Date(d.submittedAt) : null,
        })),
      });
    }

    if (input.adminComments.length) {
      await tx.adminComment.createMany({
        data: input.adminComments.map((c) => ({
          id: c.id,
          targetId: c.targetId,
          targetType: c.targetType,
          authorId: c.authorId,
          content: c.content,
          createdAt: new Date(c.createdAt),
          visibility: c.visibility,
        })),
      });
    }

    if (input.studentComments.length) {
      await tx.studentComment.createMany({
        data: input.studentComments.map((c) => ({
          id: c.id,
          dutyId: c.dutyId ?? null,
          commentType: c.commentType ?? null,
          authorId: c.authorId,
          content: c.content,
          createdAt: new Date(c.createdAt),
        })),
      });
    }
  }, { timeout: REPLACE_SCHEDULE_TX_MS });
}
