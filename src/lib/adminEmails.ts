/**
 * Admins are bound by login email, not by a role column. This list is bundled
 * into the client so the /admin page can show a friendly "access denied"
 * without calling the API; the API routes re-check it server-side and are the
 * real gate.
 */
export const ADMIN_EMAILS: readonly string[] = ['lvsijia0228@gmail.com', 'yyj.tom@gmail.com'];

export const normalizeForCompare = (value: string): string => value.trim().toLowerCase();

export const isAdminEmail = (email: string | null | undefined): boolean =>
  Boolean(email) && ADMIN_EMAILS.includes(normalizeForCompare(email as string));
