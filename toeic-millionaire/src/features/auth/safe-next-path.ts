export function safeNextPath(
  next: string | null | undefined,
  fallback = "/play",
): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}
