# Deploy — 15 Lessons Program Video (MP4)

The home page plays `/assets/video/15-Lessons-English-Program.mp4` in a modal. The file is **~3.1 GB** and is **gitignored** — it is not baked into the Docker image. Use a **persistent volume** on Dokploy so redeploys do not delete the upload.

## Container path (required)

| Item | Value |
|------|--------|
| URL | `https://www.mltcenters.com/assets/video/15-Lessons-English-Program.mp4` |
| Path inside container | `/app/dist/assets/video/15-Lessons-English-Program.mp4` |
| Volume mount point | `/app/dist/assets/video` |

## Option 1 — Dokploy UI (recommended)

1. Open your **mltcenters** application in Dokploy.
2. Go to **Mounts** (or **Volumes** / **Advanced** depending on Dokploy version).
3. Add a **Volume** mount:
   - **Mount path (in container):** `/app/dist/assets/video`
   - **Volume name:** e.g. `mltcenters-program-video` (create new named volume)
4. **Redeploy** the application (creates the volume and empty directory).
5. Upload the MP4 **once** into the volume (see [Upload](#upload-the-mp4-once) below).
6. Verify:

```bash
curl -I https://www.mltcenters.com/assets/video/15-Lessons-English-Program.mp4
```

Expect `HTTP/2 200` and `content-type: video/mp4`.

## Option 2 — docker-compose.yml (repo)

This repo’s `docker-compose.yml` declares a named volume `program_video` mounted at `/app/dist/assets/video`. After deploy:

```bash
docker ps | grep mltcenters
docker exec -it CONTAINER_ID ls -la /app/dist/assets/video
```

Upload the file into that path (see below). The volume survives `docker compose up --build` redeploys.

## Upload the MP4 (once)

From your Mac (file is at `public/assets/video/15-Lessons-English-Program.mp4` locally):

```bash
# 1) Copy to server (replace USER@HOST)
rsync -avP \
  "/Applications/MAMP/htdocs/mltcenters/public/assets/video/15-Lessons-English-Program.mp4" \
  USER@HOST:/tmp/15-Lessons-English-Program.mp4

# 2) On the server — find container
docker ps | grep mltcenters

# 3) Copy into the mounted volume
docker cp /tmp/15-Lessons-English-Program.mp4 \
  CONTAINER_ID:/app/dist/assets/video/15-Lessons-English-Program.mp4

# 4) Confirm size (~3.1G)
docker exec CONTAINER_ID ls -lh /app/dist/assets/video/
```

Use `rsync -P` so an interrupted upload can resume.

## Local development

Place the file at:

```
public/assets/video/15-Lessons-English-Program.mp4
```

Vite serves it at `/assets/video/15-Lessons-English-Program.mp4` during `npm run dev`. After `npm run build`, it would be copied to `dist/` — but do **not** commit the MP4 to git.

## Alternative: YouTube

Set on Dokploy (build-time / Vite env):

```env
VITE_PROGRAM_VIDEO_YOUTUBE_ID=your_youtube_video_id
```

Redeploy the frontend build. YouTube takes precedence over the MP4 path. See [2026-09-01-15-lessons-video-home-design.md](superpowers/specs/2026-09-01-15-lessons-video-home-design.md).

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `404` on `.mp4` | File missing in `/app/dist/assets/video/` — upload again |
| Worked, then 404 after redeploy | Volume not mounted — configure mount before redeploy |
| Video stutters on mobile | Expected for 3.1 GB self-hosted; prefer YouTube or compress |
| Modal opens but no playback | Check browser Network tab for MP4 status code |

## Related files

- `Dockerfile.prod` — creates `/app/dist/assets/video`, declares `VOLUME`
- `docker-compose.yml` — `program_video` named volume
- `server/start.sh` — ensures directory exists on boot
- `src/constants/program-video.ts` — default MP4 path
