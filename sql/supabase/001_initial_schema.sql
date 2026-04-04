-- Webster dorm platform — PostgreSQL schema for Supabase
-- Run this in: Supabase Dashboard → SQL → New query → Run
--
-- Matches Prisma models in prisma/schema.prisma (column names use Prisma defaults).
-- After creating tables, set DATABASE_URL to your Supabase pooler URL and switch
-- prisma/schema.prisma datasource provider to "postgresql".
--
-- RLS: These tables are intended for server-side access (Prisma + JWT). If you use
-- the Supabase client from the browser, enable RLS and add policies; for API-only
-- access with the service role or Prisma from Next.js, you can leave RLS disabled
-- on these tables or restrict anon/authenticated as needed.

-- Users (auth profile + admin flag; passwords are bcrypt hashes from the app)
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  name TEXT NOT NULL,
  surname TEXT NOT NULL,
  phone TEXT NOT NULL,
  "roomNumber" TEXT NOT NULL,
  gender TEXT NOT NULL,
  "isAdmin" BOOLEAN NOT NULL DEFAULT false,
  "registeredAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User" (email);

-- Laundry slots (bookingQueue is JSON array of user id strings, stored as text)
CREATE TABLE IF NOT EXISTS "LaundrySlot" (
  id TEXT PRIMARY KEY,
  "launderyNumber" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  date TEXT NOT NULL,
  "bookedById" TEXT,
  "bookingQueue" TEXT NOT NULL DEFAULT '[]',
  gender TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1
);

-- Gym slots
CREATE TABLE IF NOT EXISTS "GymSlot" (
  id TEXT PRIMARY KEY,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  date TEXT NOT NULL,
  "bookedUserIds" TEXT NOT NULL DEFAULT '[]',
  "bookingQueue" TEXT NOT NULL DEFAULT '[]',
  capacity INTEGER NOT NULL DEFAULT 10
);

-- Kitchen / clean duties
CREATE TABLE IF NOT EXISTS "CleanDuty" (
  id TEXT PRIMARY KEY,
  "assignedRoom" TEXT NOT NULL,
  "kitchenFloor" INTEGER,
  "assignedRoomNumber" TEXT,
  "assignedUsers" TEXT NOT NULL DEFAULT '[]',
  date TEXT NOT NULL,
  "photoUrls" TEXT,
  status TEXT NOT NULL,
  "submittedAt" TIMESTAMPTZ
);

-- Admin comments (on duties, submissions, etc.)
CREATE TABLE IF NOT EXISTS "AdminComment" (
  id TEXT PRIMARY KEY,
  "targetId" TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  content TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  visibility TEXT NOT NULL DEFAULT 'admin_only'
);

-- Student comments (duty-scoped or general)
CREATE TABLE IF NOT EXISTS "StudentComment" (
  id TEXT PRIMARY KEY,
  "dutyId" TEXT,
  "commentType" TEXT,
  "authorId" TEXT NOT NULL,
  content TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helpful for loading the schedule by day (optional but cheap on row counts you likely have)
CREATE INDEX IF NOT EXISTS "LaundrySlot_date_idx" ON "LaundrySlot" (date);
CREATE INDEX IF NOT EXISTS "GymSlot_date_idx" ON "GymSlot" (date);
CREATE INDEX IF NOT EXISTS "CleanDuty_date_idx" ON "CleanDuty" (date);
CREATE INDEX IF NOT EXISTS "StudentComment_dutyId_idx" ON "StudentComment" ("dutyId");
CREATE INDEX IF NOT EXISTS "AdminComment_targetId_idx" ON "AdminComment" ("targetId");
