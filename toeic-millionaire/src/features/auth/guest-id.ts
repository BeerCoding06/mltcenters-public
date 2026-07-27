const STORAGE_KEY = "toeic_guest_id";

function createGuestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getGuestId(): string {
  if (typeof window === "undefined") {
    return "";
  }
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = createGuestId();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export function ensureGuestId(): string {
  const id = getGuestId();
  if (!id) {
    const next = createGuestId();
    localStorage.setItem(STORAGE_KEY, next);
    return next;
  }
  return id;
}
