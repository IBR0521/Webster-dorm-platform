-- Grant admin in the app (public."User".isAdmin) for accounts YOU already created
-- (e.g. registered through the platform or added in Supabase Auth + matching User row).
--
-- Run once in Supabase → SQL → New query (after those users exist in public."User").

UPDATE "User"
SET "isAdmin" = true
WHERE email IN (
  'admin1@webster.edu',
  'admin2@webster.edu',
  'admin3@webster.edu'
);

-- Optional: confirm
-- SELECT email, "isAdmin" FROM "User" WHERE "isAdmin" = true;
