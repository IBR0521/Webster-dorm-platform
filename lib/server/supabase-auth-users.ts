import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin, isSupabaseStorageConfigured } from '@/lib/server/supabase-storage';

/** Same env as Storage: URL + service role — used for Auth admin + server sign-in. */
export function isSupabaseAuthUsersEnabled(): boolean {
  return isSupabaseStorageConfigured();
}

/** Prefer anon key for password grant; service role is a fallback (server-only). */
function getSupabaseForPasswordAuth(): SupabaseClient {
  const url = process.env.SUPABASE_URL!;
  const anon = process.env.SUPABASE_ANON_KEY?.trim();
  if (anon) {
    return createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return getSupabaseAdmin();
}

export async function supabaseAdminCreateUser(opts: {
  email: string;
  password: string;
  name: string;
  surname: string;
  phone: string;
  roomNumber: string;
  gender: string;
}): Promise<{ id: string } | { error: string }> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.admin.createUser({
    email: opts.email,
    password: opts.password,
    email_confirm: true,
    user_metadata: {
      name: opts.name,
      surname: opts.surname,
      phone: opts.phone,
      room_number: opts.roomNumber,
      gender: opts.gender,
    },
  });
  if (error) return { error: error.message };
  const id = data.user?.id;
  if (!id) return { error: 'Auth user was not created' };
  return { id };
}

export async function supabaseAdminDeleteUser(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.auth.admin.deleteUser(userId);
}

/** Verifies email/password against Supabase Auth (GoTrue). */
export async function supabaseSignInWithPassword(
  email: string,
  password: string
): Promise<
  | {
      userId: string;
      email: string;
      userMetadata: Record<string, unknown>;
    }
  | { error: string }
> {
  const supabase = getSupabaseForPasswordAuth();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user?.id) {
    return { error: error?.message ?? 'Invalid email or password' };
  }
  const authEmail = (data.user.email ?? email).toLowerCase().trim();
  return {
    userId: data.user.id,
    email: authEmail,
    userMetadata: (data.user.user_metadata ?? {}) as Record<string, unknown>,
  };
}
