/**
 * Whether the register API may set isAdmin from the client's account type choice.
 * `next dev` allows it; production requires ALLOW_REGISTER_AS_ADMIN=1.
 */
export function allowRegisterAsAdmin(): boolean {
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.ALLOW_REGISTER_AS_ADMIN === '1'
  );
}
