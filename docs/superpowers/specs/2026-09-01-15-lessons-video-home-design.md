# 15 Lessons English Program — Home Video Section Design Spec

**Date:** 2026-09-01  
**Status:** Approved (product decisions) — awaiting written-spec confirmation  
**Project:** MLTCENTERS (React + Vite)

## 1. Goals

Add a marketing-focused video section on the Home page that:

- Introduces the **15 Lessons English Program** to new visitors
- Matches the existing pastel gradient design system (`#5BC0FF`, `#6EE7B7`, `rounded-2xl`, `Reveal`)
- Opens the full program video in a **modal/lightbox** when the user taps Play (no navigation away from Home)
- Drives registration via a clear CTA to `/register`
- Does **not** degrade Home performance (no 3.1 GB asset loaded on page load)

## 2. Decisions (locked)

| Topic | Choice |
|-------|--------|
| Purpose | Marketing — attract new visitors and encourage registration |
| Placement | Home (`/`), new section `#program-video` below `#about-value`, above gallery preview |
| Interaction | Poster + Play button → modal with video player |
| Video hosting | **YouTube embed** (channel to be created; video uploaded once) |
| Source file | `public/assets/video/15-Lessons-English-Program.mp4` (~3.1 GB, 720p, ~89 min) — **not deployed via git**; used only for upload + poster extraction |
| Autoplay | Off until user clicks Play |
| Chapters / dedicated page | Out of scope |
| i18n | Thai + English copy via existing `useI18n` |

## 3. Why not self-host the MP4

| Issue | Impact |
|-------|--------|
| 3.1 GB in repo / `public/` | Slow deploys, bloated git, Dokploy build failures |
| Direct `<video src>` on first paint | Heavy bandwidth; poor mobile experience |
| No CDN | Server egress cost and buffering on 89-minute file |

**YouTube embed** is the recommended path: free CDN, adaptive streaming, lazy iframe load only after modal open.

**Fallback (future):** transcode to HLS on Cloudflare Stream or similar; swap player source in `ProgramVideoModal` without changing Home layout.

## 4. User flow

```
Home scroll → #program-video section
    │
    ├─ See poster + title + subtitle + Register CTA
    │
    └─ Tap Play
           │
           ▼
       Modal opens (backdrop blur, focus trap)
           │
           ├─ YouTube iframe loads (lazy, autoplay=1 in embed URL after user gesture)
           │
           └─ Close: ✕ button | ESC | backdrop click
                  → iframe removed/unmounted (stop playback)
```

## 5. UI design

### 5.1 Section layout (`ProgramVideoSection`)

- Container: `container mx-auto px-6`, consistent with Home sections
- Background: subtle gradient band matching `#about-value` (or `bg-[#F8FAFC]` with gradient blobs)
- `Reveal` animation for heading and poster (same pattern as `Index.tsx`)
- **Poster block:** `aspect-video`, `rounded-2xl`, `shadow-xl`, pastel overlay (`img-pastel-overlay`)
- **Play control:** centered circle button, gradient fill, `touch-manipulation`, min 48×48px tap target
- **CTA:** gradient button linking to `/register` (same style as hero CTA)

### 5.2 Modal (`ProgramVideoModal`)

- `role="dialog"` + `aria-modal="true"`
- Backdrop: `bg-black/60 backdrop-blur-sm` (match existing Home image lightbox)
- Panel: `max-w-4xl w-full`, `rounded-2xl`, `aspect-video` iframe container
- Close: top-right button with `aria-label` from i18n
- Mobile: `max-h-[90dvh]`, respect `safe-area-inset`
- Body scroll locked while open (`document.body.style.overflow = 'hidden'`)
- Focus: trap focus inside modal; restore focus to Play button on close

### 5.3 Poster asset

- Path: `public/assets/img-design-about/15-lessons-poster.webp`
- Generate once from source MP4 (example):

```bash
ffmpeg -ss 00:00:05 -i public/assets/video/15-Lessons-English-Program.mp4 \
  -frames:v 1 -q:v 80 public/assets/img-design-about/15-lessons-poster.webp
```

- WebP target: &lt; 150 KB; include width/height attributes for CLS

## 6. Frontend structure

| File | Responsibility |
|------|----------------|
| `src/constants/program-video.ts` | `YOUTUBE_VIDEO_ID` from `import.meta.env.VITE_PROGRAM_VIDEO_YOUTUBE_ID`, poster path, embed URL builder |
| `src/components/ProgramVideoSection.tsx` | Home section: copy, poster, Play, Register CTA, analytics |
| `src/components/ProgramVideoModal.tsx` | Dialog shell, lazy iframe, a11y, close handlers |
| `src/lib/i18n.tsx` | `programVideo.*` strings (TH/EN) |
| `src/pages/Index.tsx` | Insert `<ProgramVideoSection />` after `#about-value` section |
| `src/analytics/analytics-context.ts` | New event name constants |

### 6.1 Config

```env
# .env.example
VITE_PROGRAM_VIDEO_YOUTUBE_ID=   # YouTube video ID after upload (required for production)
```

- If ID is empty: section still renders poster + Play; modal shows friendly “video coming soon” message (dev/staging only) — **do not** embed broken iframe
- Production deploy checklist: ID must be set before go-live

### 6.2 i18n keys (draft)

| Key | TH | EN |
|-----|----|----|
| `programVideo.title` | 15 Lessons English Program | 15 Lessons English Program |
| `programVideo.subtitle` | ดูภาพรวมหลักสูตรภาษาอังกฤษ 15 บทเรียน — จาก MLTCENTERS | Watch the full overview of our 15-lesson English program |
| `programVideo.cta` | ลงทะเบียนเลย | Register now |
| `programVideo.playLabel` | เล่นวิดีโอแนะนำหลักสูตร | Play program video |
| `programVideo.closeLabel` | ปิดวิดีโอ | Close video |
| `programVideo.unavailable` | วิดีโอกำลังจะเปิดให้ชมเร็ว ๆ นี้ | Video coming soon |

### 6.3 YouTube embed URL

```
https://www.youtube-nocookie.com/embed/{VIDEO_ID}?autoplay=1&rel=0&modestbranding=1
```

- Use `youtube-nocookie.com` for privacy
- `autoplay=1` only after explicit Play click (user gesture satisfied)

## 7. Analytics

Add to `ANALYTICS_EVENTS`:

| Event | When | Metadata |
|-------|------|----------|
| `program_video_play_click` | User opens modal | `source: 'home'` |
| `program_video_modal_close` | Modal closed | `method: 'button' \| 'escape' \| 'backdrop'` |
| `program_video_register_click` | Register CTA in section | — |

No iframe watch-percent tracking in v1 (YouTube API out of scope).

## 8. SEO & structured data

- No new route; Home SEO unchanged except optional mention in visible copy
- Optional: extend `JsonLd.tsx` with `VideoObject` when YouTube ID is set and video is **Public** (skip for Unlisted)

## 9. Repository hygiene

- Add `public/assets/video/*.mp4` to `.gitignore` if not already ignored
- Commit only: poster WebP, components, i18n, spec, env example
- Document upload steps in implementation plan (not in this spec’s runtime code)

### YouTube setup (one-time, manual)

1. Create YouTube channel (e.g. MLTCENTERS / Krumam Club)
2. Upload `15-Lessons-English-Program.mp4`
3. Visibility: **Unlisted** (recommended) or Public
4. Copy video ID → `VITE_PROGRAM_VIDEO_YOUTUBE_ID` in Dokploy env
5. Redeploy frontend

## 10. Testing

| # | Check |
|---|--------|
| 1 | Home loads with zero requests to YouTube until Play |
| 2 | Modal open/close on mobile Safari + desktop Chrome |
| 3 | ESC and backdrop close stop playback (iframe unmounted) |
| 4 | Register CTA navigates to `/register` |
| 5 | TH/EN strings switch correctly |
| 6 | Analytics events fire (smoke via `/admin/analytics` if enabled) |
| 7 | Lighthouse: no CLS from poster (explicit dimensions) |

## 11. Out of scope (this iteration)

- Dedicated `/programs/15-lessons` page
- 15-chapter timeline or seek markers
- Autoplay on Home scroll
- Self-hosted MP4 streaming without YouTube
- Video paywall / enrolled-only access
- YouTube watch-time API integration

## 12. Success criteria

- Marketing video is discoverable on Home without hurting LCP
- One tap opens full program video in a polished modal on phone and desktop
- Register CTA is visible below the poster
- Production uses YouTube ID from env; 3.1 GB MP4 is not in git or deploy artifact
- All vitest + typecheck pass after implementation
