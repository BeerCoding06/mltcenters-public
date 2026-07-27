# Task 10 Report — Board UI + Solo Game Loop

**Status:** Complete  
**Date:** 2026-07-27

## Delivered

- **Landing** `app/(marketing)/page.tsx` — guest CTA, theme toggle, link to `/play`
- **Lobby** `app/(game)/play/page.tsx` — difficulty, bot count 1–3, displayName → `POST /api/game/start` → `/board/[sessionId]`
- **Board** `app/(game)/board/[sessionId]/page.tsx` + `BoardGame.tsx` — roll, dice animation, tile resolution, modals, bot auto-roll, end screen
- **BoardCanvas** — 40 tiles from `board/tiles.json`, glassmorphism navy grid, player tokens
- **Hud** — coins, EXP, lap, turn indicator (`aria-live`)
- **useGameStore** (Zustand) + **useGameSession** (React Query poll 4s)
- **guest-id.ts** — `localStorage` `toeic_guest_id`
- **ThemeProvider** (next-themes) + gold/emerald/navy CSS tokens

## Verification

- `npm run build` — pass
- `npm test` — 69/69 pass

## Notes

- Prisma 7 driver adapter (`@prisma/adapter-pg`) added so production build succeeds.
- Bot quiz/card tiles show info toast (no modal) — human-only modals for P1.
