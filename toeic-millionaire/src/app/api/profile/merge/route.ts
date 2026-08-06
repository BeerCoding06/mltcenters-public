import { NextResponse } from "next/server";

/**
 * Profile merge requires Postgres — guest play works without it.
 * Keep endpoint so login UI does not hard-fail.
 */
export async function POST() {
  return NextResponse.json({
    ok: true,
    merged: false,
    mode: "memory",
    message: "Guest progress is kept in this browser only (no database).",
  });
}
