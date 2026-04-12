import { NextResponse } from 'next/server';
import { invalidateSessionUserCache, requireAdmin } from '@/lib/server/api-guard';
import { prisma } from '@/lib/server/prisma';
import { deleteResidentProfile } from '@/lib/server/delete-resident-profile';
import {
  isSupabaseAuthUsersEnabled,
  supabaseAdminDeleteUser,
} from '@/lib/server/supabase-auth-users';

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, context: Ctx) {
  const r = await requireAdmin();
  if ('response' in r) return r.response;

  const { id: targetId } = await context.params;
  if (!targetId?.trim()) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
  }

  if (targetId === r.dbUser.id) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } });
  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }
  if (target.isAdmin) {
    return NextResponse.json({ error: 'Cannot delete admin accounts' }, { status: 403 });
  }

  try {
    await deleteResidentProfile(targetId);
  } catch (e) {
    console.error('deleteResidentProfile', e);
    return NextResponse.json({ error: 'Failed to remove user' }, { status: 500 });
  }

  invalidateSessionUserCache(targetId);

  if (isSupabaseAuthUsersEnabled()) {
    try {
      await supabaseAdminDeleteUser(targetId);
    } catch {
      /* Auth user may already be deleted — app row is gone either way */
    }
  }

  return NextResponse.json({ ok: true });
}
