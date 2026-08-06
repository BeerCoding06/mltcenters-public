#!/bin/sh
set -e

# Inherit Dokploy DATABASE_URL for Next + migrate. Fall back DIRECT_URL.
if [ -n "${DATABASE_URL:-}" ] && [ -z "${DIRECT_URL:-}" ]; then
  export DIRECT_URL="$DATABASE_URL"
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[millionaire] ERROR: DATABASE_URL is not set — Start Game will fail until Postgres is configured"
elif [ -d /app/millionaire-tools/prisma ]; then
  echo "[millionaire] DATABASE_URL present — running prisma migrate deploy"
  (
    cd /app/millionaire-tools
    ./node_modules/.bin/prisma migrate deploy
  ) && echo "[millionaire] migrate OK" || echo "[millionaire] WARNING: migrate failed (check DB URL / permissions)"

  echo "[millionaire] seeding questions (safe to re-run)"
  (
    cd /app/millionaire-tools
    ./node_modules/.bin/tsx prisma/seed.ts
  ) && echo "[millionaire] seed OK" || echo "[millionaire] WARNING: seed failed or already seeded"
else
  echo "[millionaire] WARNING: /app/millionaire-tools missing — skip migrate/seed"
fi

# Start Next.js TOEIC game (internal). Do NOT export PORT into this shell —
# Express must keep Dokploy's PORT (usually 3000) or Traefik returns 502.
if [ -f /app/millionaire/server.js ]; then
  echo "[millionaire] starting on :3002 (basePath /millionaire)"
  (
    cd /app/millionaire
    PORT=3002 HOSTNAME=0.0.0.0 node server.js
  ) &
  MILLIONAIRE_PID=$!
  sleep 1
  if ! kill -0 "$MILLIONAIRE_PID" 2>/dev/null; then
    echo "[millionaire] WARNING: process exited immediately — check logs / DATABASE_URL"
  else
    echo "[millionaire] pid=$MILLIONAIRE_PID ready (or starting)"
  fi
else
  echo "[millionaire] server.js missing — /millionaire will return 503 HTML"
fi

cd /app/server
echo "[express] starting on PORT=${PORT:-3000}"
exec node index.js
