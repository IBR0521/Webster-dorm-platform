import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/server/api-guard';
import { gymBookWindow, gymCancelWindow } from '@/lib/server/gym-booking';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(_req: Request, context: Ctx) {
  const r = await requireSessionUser();
  if ('response' in r) return r.response;
  const { id } = await context.params;
  try {
    const gymSlots = await gymBookWindow([id], r.dbUser.id);
    return NextResponse.json({ gymSlots });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'SLOT_NOT_FOUND') {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }
    throw e;
  }
}

export async function DELETE(_req: Request, context: Ctx) {
  const r = await requireSessionUser();
  if ('response' in r) return r.response;
  const { id } = await context.params;
  const gymSlots = await gymCancelWindow([id], r.dbUser.id);
  return NextResponse.json({ gymSlots });
}
