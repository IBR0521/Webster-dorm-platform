/** Client-visible flag: set NEXT_PUBLIC_DATABASE_ENABLED=1 to use API + Prisma instead of localStorage. */
export function isDatabaseEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DATABASE_ENABLED === '1';
}
