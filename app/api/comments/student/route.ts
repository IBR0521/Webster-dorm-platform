import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { requireSessionUser } from '@/lib/server/api-guard';
import { prisma } from '@/lib/server/prisma';

const bodySchema = z.object({
  dutyId: z.string().optional(),
  commentType: z.enum(['duty', 'general']).optional(),
  content: z.string().min(1).max(8000),
});

export async function POST(req: Request) {
  const r = await requireSessionUser();
  if ('response' in r) return r.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid body', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const id = randomUUID();
  const createdAt = new Date();
  await prisma.studentComment.create({
    data: {
      id,
      dutyId: parsed.data.dutyId ?? null,
      commentType: parsed.data.commentType ?? null,
      authorId: r.dbUser.id,
      content: parsed.data.content,
      createdAt,
    },
  });

  const studentComment = {
    id,
    dutyId: parsed.data.dutyId,
    commentType: parsed.data.commentType,
    authorId: r.dbUser.id,
    content: parsed.data.content,
    createdAt,
  };

  return NextResponse.json({ studentComment });
}
