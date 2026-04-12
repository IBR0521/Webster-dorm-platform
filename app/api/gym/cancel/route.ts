import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSessionUser } from '@/lib/server/api-guard';
import { gymCancelWindow } from '@/lib/server/gym-booking';

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

  const gymSlots = await gymCancelWindow(parsed.data.slotIds, r.dbUser.id);
  return NextResponse.json({ gymSlots });
}
