import { NextResponse } from 'next/server';
import { z } from 'zod';
import { loadFullSchedule, replaceFullSchedule } from '@/lib/server/schedule-repo';
import { requireSessionUser } from '@/lib/server/api-guard';

const laundrySchema = z.object({
  id: z.string(),
  launderyNumber: z.number(),
  startTime: z.string(),
  endTime: z.string(),
  date: z.string(),
  bookedBy: z.string().optional(),
  bookingQueue: z.array(z.string()).optional(),
  gender: z.enum(['male', 'female']),
  capacity: z.number(),
});

const gymSchema = z.object({
  id: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  date: z.string(),
  bookedUserIds: z.array(z.string()).optional(),
  bookingQueue: z.array(z.string()).optional(),
  capacity: z.number(),
});

const dutySchema = z.object({
  id: z.string(),
  assignedRoom: z.string(),
  kitchenFloor: z.number().optional(),
  assignedRoomNumber: z.string().optional(),
  assignedUsers: z.array(z.string()),
  date: z.string(),
  photoUrls: z.array(z.string()).optional(),
  status: z.enum(['pending', 'approved', 'rejected']),
  submittedAt: z.union([z.string(), z.date()]).optional().nullable(),
});

const adminCommentSchema = z.object({
  id: z.string(),
  targetId: z.string(),
  targetType: z.enum(['duty', 'user', 'submission', 'student_comment']),
  authorId: z.string(),
  content: z.string(),
  createdAt: z.union([z.string(), z.date()]),
  visibility: z.literal('admin_only'),
});

const studentCommentSchema = z.object({
  id: z.string(),
  dutyId: z.string().optional(),
  commentType: z.enum(['duty', 'general']).optional(),
  authorId: z.string(),
  content: z.string(),
  createdAt: z.union([z.string(), z.date()]),
});

const putSchema = z.object({
  laundrySlots: z.array(laundrySchema),
  gymSlots: z.array(gymSchema),
  cleanDuties: z.array(dutySchema),
  adminComments: z.array(adminCommentSchema),
  studentComments: z.array(studentCommentSchema),
});

export async function GET() {
  const r = await requireSessionUser();
  if ('response' in r) return r.response;

  const data = await loadFullSchedule();
  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const r = await requireSessionUser();
  if ('response' in r) return r.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = putSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', details: parsed.error.flatten() }, { status: 400 });
  }

  const p = parsed.data;
  await replaceFullSchedule({
    laundrySlots: p.laundrySlots.map((s) => ({
      ...s,
      bookingQueue: s.bookingQueue ?? [],
    })),
    gymSlots: p.gymSlots.map((s) => ({
      ...s,
      bookedUserIds: s.bookedUserIds,
      bookingQueue: s.bookingQueue ?? [],
    })),
    cleanDuties: p.cleanDuties.map((d) => ({
      ...d,
      submittedAt: d.submittedAt
        ? new Date(d.submittedAt as string | Date)
        : undefined,
    })),
    adminComments: p.adminComments.map((c) => ({
      ...c,
      createdAt: new Date(c.createdAt as string | Date),
    })),
    studentComments: p.studentComments.map((c) => ({
      ...c,
      createdAt: new Date(c.createdAt as string | Date),
    })),
  });

  return NextResponse.json({ ok: true });
}
