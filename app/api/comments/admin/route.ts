import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { requireAdmin } from '@/lib/server/api-guard';
import { prisma } from '@/lib/server/prisma';

const bodySchema = z.object({
  targetId: z.string().min(1),
  targetType: z.enum(['duty', 'user', 'submission', 'student_comment']),
  content: z.string().min(1).max(8000),
});

export async function POST(req: Request) {
  const r = await requireAdmin();
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
  await prisma.adminComment.create({
    data: {
      id,
      targetId: parsed.data.targetId,
      targetType: parsed.data.targetType,
      authorId: r.dbUser.id,
      content: parsed.data.content,
      createdAt,
      visibility: 'admin_only',
    },
  });

  const comment = {
    id,
    targetId: parsed.data.targetId,
    targetType: parsed.data.targetType,
    authorId: r.dbUser.id,
    content: parsed.data.content,
    createdAt,
    visibility: 'admin_only' as const,
  };

  return NextResponse.json({ adminComment: comment });
}
