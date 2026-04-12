import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/api-guard';
import { prisma } from '@/lib/server/prisma';

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, context: Ctx) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const result = await prisma.adminComment.deleteMany({ where: { id } });
  if (result.count === 0) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
