import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/api-guard';
import { rejectCleanDuty } from '@/lib/server/clean-duty-mutations';
import { signCleanDutyPhotoUrls } from '@/lib/server/supabase-storage';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(_req: Request, context: Ctx) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;
  const { id } = await context.params;
  const duty = await rejectCleanDuty(id);
  if (!duty) {
    return NextResponse.json({ error: 'Duty not found' }, { status: 404 });
  }
  const cleanDuty = await signCleanDutyPhotoUrls(duty);
  return NextResponse.json({ cleanDuty });
}
