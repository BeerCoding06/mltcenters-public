/** Twemoji CDN — consistent illustrated emoji for all devices. */

export function isLocalOrRemoteImage(value: string): boolean {
  return value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://");
}

export function resolveQuestionImageSrc(image: string): string | null {
  if (!image) return null;
  if (isLocalOrRemoteImage(image)) return image;
  return emojiToImageUrl(image);
}

export function emojiToImageUrl(emoji: string): string | null {
  if (!emoji) return null;
  const parts: string[] = [];
  for (const char of emoji) {
    const cp = char.codePointAt(0);
    if (cp == null || cp === 0xfe0f) continue;
    parts.push(cp.toString(16));
  }
  if (!parts.length) return null;
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${parts.join("-")}.png`;
}
