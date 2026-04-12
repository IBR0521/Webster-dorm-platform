-- Private bucket for kitchen duty photo uploads (server uses service role + signed URLs).
-- Run in Supabase Dashboard → SQL Editor if uploads fail with "Bucket not found".
-- Name must match SUPABASE_DUTY_PHOTOS_BUCKET (default: duty-photos).

INSERT INTO storage.buckets (id, name, public)
VALUES ('duty-photos', 'duty-photos', false)
ON CONFLICT (id) DO NOTHING;
