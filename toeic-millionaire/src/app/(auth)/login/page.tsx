"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ensureGuestId } from "@/features/auth/guest-id";
import { safeNextPath } from "@/features/auth/safe-next-path";
import { createSupabaseBrowserClient } from "@/features/auth/supabase-browser";
import { isSupabaseConfigured } from "@/features/auth/supabase-config";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const authError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"magic" | "password">("magic");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(
    authError === "auth" ? "Sign-in failed. Please try again." : null,
  );
  const [checkingSession, setCheckingSession] = useState(true);

  const supabaseConfigured = isSupabaseConfigured();

  useEffect(() => {
    if (!supabaseConfigured) {
      setCheckingSession(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();

    async function finishLogin() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setCheckingSession(false);
        return;
      }

      try {
        const guestId = ensureGuestId();
        await fetch("/api/profile/merge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestId }),
        });
      } catch {
        // Merge is best-effort; guest play still works.
      }

      router.replace(next);
    }

    void finishLogin();
  }, [next, router, supabaseConfigured]);

  async function handleMagicLink(event: React.FormEvent) {
    event.preventDefault();
    if (!supabaseConfigured) return;

    setLoading(true);
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });

      if (error) {
        throw error;
      }

      setMessage("Check your email for the magic link.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not send magic link");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSignIn(event: React.FormEvent) {
    event.preventDefault();
    if (!supabaseConfigured) return;

    setLoading(true);
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      const guestId = ensureGuestId();
      await fetch("/api/profile/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId }),
      });

      router.replace(next);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    if (!supabaseConfigured) return;

    setLoading(true);
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (error) {
        throw error;
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Google sign-in failed");
      setLoading(false);
    }
  }

  if (checkingSession && supabaseConfigured) {
    return (
      <p className="text-center text-sm text-[var(--millionaire-silver)]">
        Checking session…
      </p>
    );
  }

  if (!supabaseConfigured) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-[var(--millionaire-silver)]">
          Account sign-in is not configured yet. You can still play as a guest —
          progress is saved on this device only.
        </p>
        <Link
          href="/play"
          className="inline-flex text-sm text-[var(--millionaire-cyan)] hover:underline"
        >
          Continue as guest →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex rounded-full border border-[var(--millionaire-silver)]/40 p-1">
        <button
          type="button"
          onClick={() => setMode("magic")}
          className={`flex-1 rounded-full px-3 py-1.5 text-sm transition ${
            mode === "magic"
              ? "bg-[var(--millionaire-gold)] text-black"
              : "text-[var(--millionaire-silver)]"
          }`}
        >
          Magic link
        </button>
        <button
          type="button"
          onClick={() => setMode("password")}
          className={`flex-1 rounded-full px-3 py-1.5 text-sm transition ${
            mode === "password"
              ? "bg-[var(--millionaire-gold)] text-black"
              : "text-[var(--millionaire-silver)]"
          }`}
        >
          Password
        </button>
      </div>

      <form
        onSubmit={mode === "magic" ? handleMagicLink : handlePasswordSignIn}
        className="space-y-4"
      >
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-white">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-full border border-[var(--millionaire-silver)]/50 bg-black px-4 py-2 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--millionaire-cyan)]/50"
            placeholder="you@example.com"
          />
        </label>

        {mode === "password" ? (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-white">Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-full border border-[var(--millionaire-silver)]/50 bg-black px-4 py-2 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--millionaire-cyan)]/50"
            />
          </label>
        ) : null}

        {message ? (
          <p
            className={`text-sm ${
              message.includes("Check your email")
                ? "text-[var(--millionaire-correct)]"
                : "text-[var(--millionaire-wrong)]"
            }`}
          >
            {message}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-full border-2 border-[var(--millionaire-gold)] bg-[var(--millionaire-gold)] text-black hover:bg-[var(--millionaire-gold)]/90"
        >
          {loading
            ? "Working…"
            : mode === "magic"
              ? "Send magic link"
              : "Sign in"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[var(--millionaire-silver)]/30" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-black px-2 text-[var(--millionaire-silver)]">
            or
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={loading}
        onClick={() => void handleGoogleSignIn()}
        className="w-full rounded-full border-[var(--millionaire-silver)] text-white hover:bg-black/50"
      >
        Continue with Google
      </Button>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-sm text-[var(--millionaire-silver)] hover:text-[var(--millionaire-cyan)]"
        >
          ← Home
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-6 py-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-[var(--millionaire-gold)]">
            Save your progress
          </h1>
          <p className="text-sm text-[var(--millionaire-silver)]">
            Sign in to sync coins, EXP, and stats across devices.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--millionaire-silver)]/50 bg-black p-6 shadow-[0_0_24px_rgb(91_192_255_/_8%)]">
          <Suspense
            fallback={
              <p className="text-center text-sm text-[var(--millionaire-silver)]">
                Loading…
              </p>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
