import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/server/api-guard';
import { assignCleanDutyUsers } from '@/lib/server/clean-duty-mutations';
import { signCleanDutyPhotoUrls } from '@/lib/server/supabase-storage';

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  userIds: z.array(z.string().min(1)),
  roomNumber: z.string().optional(),
});

export async function PATCH(req: Request, context: Ctx) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;
  const { id } = await context.params;

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
    const duty = await assignCleanDutyUsers(
      id,
      parsed.data.userIds,
      parsed.data.roomNumber
    );
    const cleanDuty = await signCleanDutyPhotoUrls(duty);
    return NextResponse.json({ cleanDuty });
  } catch {
    return NextResponse.json({ error: 'Duty not found' }, { status: 404 });
  }
}
