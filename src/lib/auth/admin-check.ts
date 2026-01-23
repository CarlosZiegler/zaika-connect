import { env } from "@/lib/env.server";

/**
 * Check if an email is in the admin whitelist.
 * Admin emails are configured via the ADMIN_EMAILS environment variable
 * as a comma-separated list.
 */
export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) {
    return false;
  }

  const whitelist =
    env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) ?? [];

  return whitelist.includes(email.toLowerCase());
}
