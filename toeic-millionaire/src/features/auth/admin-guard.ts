import { createSupabaseServerClient } from "@/features/auth/supabase-server";
import { isSupabaseConfigured } from "@/features/auth/supabase-config";

export function getAdminEmailAllowlist(): string[] {
  const raw = process.env.ADMIN_EMAIL_ALLOWLIST ?? "";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const allowlist = getAdminEmailAllowlist();
  if (allowlist.length === 0) return false;
  return allowlist.includes(email.trim().toLowerCase());
}

export type AdminAuthResult =
  | { ok: true; email: string; userId: string }
  | { ok: false; reason: "not_configured" | "unauthenticated" | "forbidden" };

export async function requireAdmin(): Promise<AdminAuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, reason: "not_configured" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return { ok: false, reason: "unauthenticated" };
  }

  if (!isAdminEmail(user.email)) {
    return { ok: false, reason: "forbidden" };
  }

  return { ok: true, email: user.email, userId: user.id };
}
