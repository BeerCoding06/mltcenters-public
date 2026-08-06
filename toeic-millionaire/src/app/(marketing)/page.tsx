"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ensureGuestId } from "@/features/auth/guest-id";

export default function LandingPage() {
  useEffect(() => {
    ensureGuestId();
  }, []);

  return (
    <div className="dark millionaire-studio-bg relative flex min-h-full flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-bold tracking-tight text-[var(--millionaire-gold)]">
          TOEIC เกมส์เศรษฐี
        </span>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-6 pb-16 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            ทอยลูกเต๋า. เรียนรู้.{" "}
            <span className="bg-gradient-to-r from-[var(--millionaire-gold)] to-[var(--millionaire-cyan)] bg-clip-text text-transparent">
              ชนะ.
            </span>
          </h1>
          <p className="mx-auto max-w-lg text-[var(--millionaire-silver)]">
            เกมกระดานสไตล์ Monopoly ผสมฝึก TOEIC — ตอบคำถาม เปิดการ์ดโชคดี
            และแข่งกับบอทสู่เส้นชัย
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/play"
            className={cn(
              buttonVariants({ size: "lg" }),
              "rounded-full border-2 border-[var(--millionaire-gold)] bg-[var(--millionaire-gold)] text-black hover:bg-[var(--millionaire-gold)]/90",
            )}
          >
            เล่นเลย
          </Link>
          <Link
            href="/play"
            className={buttonVariants({
              variant: "outline",
              size: "lg",
              className:
                "rounded-full border-[var(--millionaire-silver)] text-white hover:bg-black/50",
            })}
          >
            เข้าล็อบบี้
          </Link>
        </div>

        <p className="text-xs text-[var(--millionaire-silver)]">
          ไม่ต้องสมัคร · บันทึกความคืบหน้าในเครื่องเป็น Guest
        </p>
      </main>
    </div>
  );
}
