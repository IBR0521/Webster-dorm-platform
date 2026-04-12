import { NextResponse } from 'next/server';
import { requireSessionUser } from '@/lib/server/api-guard';
import { laundryBookWindow, laundryCancelWindow } from '@/lib/server/laundry-booking';

type Ctx = { params: Promise<{ id: string }> };

/** Book the current user on a single laundry slot (atomic). */
export async function PATCH(_req: Request, context: Ctx) {
  const r = await requireSessionUser();
  if ('response' in r) return r.response;
  const { id } = await context.params;
  try {
    const laundrySlots = await laundryBookWindow([id], r.dbUser.id);
    return NextResponse.json({ laundrySlots });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'SLOT_NOT_FOUND') {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }
    throw e;
  }
}

/** Cancel the current user’s booking or queue entry for this slot. */
export async function DELETE(_req: Request, context: Ctx) {
  const r = await requireSessionUser();
  if ('response' in r) return r.response;
  const { id } = await context.params;
  const laundrySlots = await laundryCancelWindow([id], r.dbUser.id);
  return NextResponse.json({ laundrySlots });
}
