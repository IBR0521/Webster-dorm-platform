import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { databaseUnavailable, requireSessionUser } from '@/lib/server/api-guard';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/server/prisma';
import {
  setCleanDutyPhotoPayload,
  userIsAssignedToDuty,
} from '@/lib/server/clean-duty-mutations';
import {
  getDutyPhotosBucket,
  getSupabaseAdmin,
  isSupabaseStorageConfigured,
  signCleanDutyPhotoUrls,
} from '@/lib/server/supabase-storage';

type Ctx = { params: Promise<{ id: string }> };

const jsonSchema = z.object({
  photoUrls: z.array(z.string()).min(1).max(24),
});

export const runtime = 'nodejs';

export async function POST(req: Request, context: Ctx) {
  const unavailable = databaseUnavailable();
  if (unavailable) return unavailable;

  try {
    const r = await requireSessionUser();
    if ('response' in r) return r.response;
    if (r.dbUser.isAdmin) {
      return NextResponse.json(
        { error: 'Admins assign kitchen duties in the Admin Panel, not student uploads.' },
        { status: 403 }
      );
    }

    const { id: dutyId } = await context.params;

    const row = await prisma.cleanDuty.findUnique({ where: { id: dutyId } });
    if (!row) {
      return NextResponse.json({ error: 'Duty not found' }, { status: 404 });
    }
    if (!userIsAssignedToDuty(row, r.dbUser.id)) {
      return NextResponse.json(
        {
          error:
            'This kitchen duty is not assigned to your account. Ask an admin to assign your room, or sign in with the profile that was assigned.',
        },
        { status: 403 }
      );
    }

    const submittedAt = new Date();
    const ct = req.headers.get('content-type') || '';

    let pathsOrUrls: string[];

    if (ct.includes('multipart/form-data')) {
      if (!isSupabaseStorageConfigured()) {
        return NextResponse.json(
          {
            error:
              'Storage is not configured (set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY). Use JSON photoUrls or configure Supabase.',
          },
          { status: 503 }
        );
      }
      const form = await req.formData();
      const blobs: Blob[] = [];
      for (const x of form.getAll('photos')) {
        if (typeof x !== 'string' && x != null && typeof x.arrayBuffer === 'function') {
          blobs.push(x);
        }
      }
      if (blobs.length === 0) {
        return NextResponse.json({ error: 'No photos uploaded' }, { status: 400 });
      }
      const bucket = getDutyPhotosBucket();
      const supabase = getSupabaseAdmin();
      pathsOrUrls = [];
      for (const blob of blobs) {
        const file = blob as File;
        const ext =
          (typeof file.name === 'string' &&
            file.name.includes('.') &&
            file.name.split('.').pop()) ||
          'jpg';
        const safeExt = String(ext).replace(/[^a-z0-9]/gi, '').slice(0, 8) || 'jpg';
        const key = `${dutyId}/${randomUUID()}.${safeExt}`;
        const buf = Buffer.from(await blob.arrayBuffer());
        const { error } = await supabase.storage.from(bucket).upload(key, buf, {
          contentType: blob.type || 'image/jpeg',
          upsert: false,
        });
        if (error) {
          const msg = error.message || 'Storage upload failed';
          if (/bucket not found/i.test(msg)) {
            return NextResponse.json(
              {
                error: `Storage bucket "${bucket}" does not exist. In Supabase open Storage → New bucket, set the name exactly to "${bucket}", choose Private, then try again. Or set SUPABASE_DUTY_PHOTOS_BUCKET in .env.local to match a bucket you already created. You can also run sql/supabase/004_storage_bucket_duty_photos.sql in the SQL Editor.`,
              },
              { status: 503 }
            );
          }
          return NextResponse.json({ error: msg }, { status: 500 });
        }
        pathsOrUrls.push(key);
      }
    } else {
      let json: unknown;
      try {
        json = await req.json();
      } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
      }
      const parsed = jsonSchema.safeParse(json);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid body', details: parsed.error.flatten() },
          { status: 400 }
        );
      }
      pathsOrUrls = parsed.data.photoUrls;
    }

    const duty = await setCleanDutyPhotoPayload(dutyId, pathsOrUrls, submittedAt);
    const cleanDuty = await signCleanDutyPhotoUrls(duty);
    return NextResponse.json({ cleanDuty });
  } catch (e) {
    console.error('[clean-duty photos POST]', e);
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: `Database error (${e.code}): ${e.message}` },
        { status: 500 }
      );
    }
    const msg =
      e instanceof Error ? e.message : 'Unexpected error while saving photos';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
