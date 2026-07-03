# Traefik routing for www.mltcenters.com (Dokploy)

## Problem

`https://www.mltcenters.com/` returns **404 from Traefik** (not from the Node app) when:

- The MLTCENTERS container is healthy on port **3000** inside Docker
- Traefik has **no router** matching `Host(`www.mltcenters.com`)` for that service

## Correct service

| Item | Value |
|------|--------|
| **Repo service** | `web` in `docker-compose.yml` |
| **Image** | Built from `Dockerfile.prod` (Vite static + Express API) |
| **Internal port** | `3000` |
| **Network** | `dokploy-network` (same as Traefik) |
| **Traefik router** | `mltcenters` |
| **Traefik service** | `mltcenters` → `loadbalancer.server.port=3000` |

This is the **only** frontend in this repository. Other frontends on the server are unrelated — do not change their labels.

## Labels (in `docker-compose.yml`)

Required routing (also under `deploy.labels` for Swarm/Dokploy):

```yaml
traefik.enable=true
traefik.docker.network=dokploy-network
traefik.http.routers.mltcenters.rule=Host(`mltcenters.com`) || Host(`www.mltcenters.com`)
traefik.http.routers.mltcenters.entrypoints=websecure
traefik.http.routers.mltcenters.tls=true
traefik.http.routers.mltcenters.tls.certresolver=letsencrypt
traefik.http.routers.mltcenters.service=mltcenters
traefik.http.services.mltcenters.loadbalancer.server.port=3000
```

## Deploy on Dokploy

1. Use **Docker Compose** deploy (or ensure Dokploy applies labels from this repo’s `docker-compose.yml`).
2. Build file: **`Dockerfile.prod`**
3. Do **not** publish host port `3000` in production — Traefik reaches the container on the overlay network.
4. Redeploy the application after merging label changes.

If Dokploy UI also sets a domain for the same host, **remove duplicate/conflicting domain entries** in the UI so only one router owns `www.mltcenters.com`.

## Cloudflare Full (strict)

- DNS: `www` and `@` proxied (orange cloud) to the server IP.
- Traefik terminates TLS on origin with **Let’s Encrypt** (`certresolver=letsencrypt`).
- Cloudflare SSL mode: **Full (strict)**.

If your Dokploy Traefik uses a different cert resolver name, change `letsencrypt` in `docker-compose.yml` to match Traefik’s `certificatesResolvers` (Dokploy default is usually `letsencrypt`).

## Validate

After redeploy:

```bash
# Should be HTTP/2 200 (or 301 then 200), not Traefik 404
curl -sI https://www.mltcenters.com/

# Root HTML
curl -sI https://www.mltcenters.com/ | grep -E 'HTTP|content-type'

# Apex redirect
curl -sI https://mltcenters.com/ | grep -i location
```

Traefik dashboard (if enabled): confirm router **`mltcenters`** is **enabled** and service **`mltcenters`** shows the MLTCENTERS task IP on port **3000**.

## Local Docker (no Traefik)

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up --build
# http://localhost:3000
```

## Note on Caddy

Older setup used host **Caddy** → Swarm service name. If Traefik now owns 80/443, disable or remove conflicting Caddy `www.mltcenters.com` blocks so only Traefik answers for that host.
