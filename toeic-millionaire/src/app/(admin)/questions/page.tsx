import Link from "next/link";
import { requireAdmin } from "@/features/auth/admin-guard";
import { QuestionsAdminPanel } from "./QuestionsAdminPanel";

function ForbiddenView({
  reason,
}: {
  reason: "not_configured" | "unauthenticated" | "forbidden";
}) {
  const copy =
    reason === "not_configured"
      ? {
          title: "Sign-in not configured",
          body: "Set Supabase env vars and ADMIN_EMAIL_ALLOWLIST to use the admin panel.",
        }
      : reason === "unauthenticated"
        ? {
            title: "Sign in required",
            body: "You must be signed in with an allowlisted admin email.",
          }
        : {
            title: "Forbidden",
            body: "Your account is not on the admin email allowlist.",
          };

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-[var(--millionaire-wrong)]">
          {copy.title}
        </h1>
        <p className="text-sm text-[var(--millionaire-silver)]">{copy.body}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-4 text-sm">
        {reason === "unauthenticated" ? (
          <Link
            href="/login?next=/questions"
            className="text-[var(--millionaire-gold)] hover:underline"
          >
            Sign in →
          </Link>
        ) : null}
        <Link
          href="/"
          className="text-[var(--millionaire-cyan)] hover:underline"
        >
          ← Home
        </Link>
      </div>
    </div>
  );
}

export default async function AdminQuestionsPage() {
  const auth = await requireAdmin();

  if (!auth.ok) {
    return <ForbiddenView reason={auth.reason} />;
  }

  return <QuestionsAdminPanel />;
}
