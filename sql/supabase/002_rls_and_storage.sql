-- Optional follow-up (only if you skipped the RLS section at the bottom of 001_initial_schema.sql)
--
-- ERROR: relation "User" does not exist
-- → You ran THIS file before creating tables. Fix: open 001_initial_schema.sql, select ALL,
--   run it once in full. Tables + RLS are both included there now.
--
-- If tables already exist (from 001 or from `prisma migrate`) but RLS was never enabled,
-- run the statements below:

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LaundrySlot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GymSlot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CleanDuty" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminComment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StudentComment" ENABLE ROW LEVEL SECURITY;

-- Storage: Dashboard → Storage → New bucket → name e.g. duty-photos → Private.
-- Do not add a public policy. Signed URLs are issued only from Next.js API routes (service role).
