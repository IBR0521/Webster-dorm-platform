import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUser } from '@/lib/server/api-guard';
import { laundryBookWindow } from '@/lib/server/laundry-booking';

const bodySchema = z.object({
  slotIds: z.array(z.string().min(1)).min(1),
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

  try {
    const laundrySlots = await laundryBookWindow(parsed.data.slotIds, r.dbUser.id);
    return NextResponse.json({ laundrySlots });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg === 'SLOT_NOT_FOUND') {
      return NextResponse.json({ error: 'One or more slots not found' }, { status: 404 });
    }
    throw e;
  }
}
