import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { CleanDuty } from '@/lib/types';

export function isSupabaseStorageConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}

export function getDutyPhotosBucket(): string {
  return process.env.SUPABASE_DUTY_PHOTOS_BUCKET?.trim() || 'duty-photos';
}

export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Paths stored in DB are object keys inside the bucket (not public URLs). */
export function looksLikeStorageObjectKey(s: string): boolean {
  if (!s || s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:')) {
    return false;
  }
  return s.includes('/') && !s.includes(' ');
}

export async function signDutyPhotoUrl(path: string): Promise<string | null> {
  if (!isSupabaseStorageConfigured() || !looksLikeStorageObjectKey(path)) {
    return null;
  }
  try {
    const supabase = getSupabaseAdmin();
    const bucket = getDutyPhotosBucket();
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

export async function signCleanDutyPhotoUrls(duty: CleanDuty): Promise<CleanDuty> {
  const urls = duty.photoUrls;
  if (!urls?.length) return duty;
  const next = await Promise.all(
    urls.map(async (u) => {
      try {
        if (looksLikeStorageObjectKey(u)) {
          const signed = await signDutyPhotoUrl(u);
          return signed ?? u;
        }
      } catch {
        /* keep storage key so client still has a reference */
      }
      return u;
    })
  );
  return { ...duty, photoUrls: next };
}

export async function deleteStorageObjects(paths: string[]): Promise<void> {
  if (!isSupabaseStorageConfigured() || paths.length === 0) return;
  const bucket = getDutyPhotosBucket();
  const keys = paths.filter(looksLikeStorageObjectKey);
  if (keys.length === 0) return;
  const supabase = getSupabaseAdmin();
  await supabase.storage.from(bucket).remove(keys);
}
