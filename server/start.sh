#!/bin/sh
set -e

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
    echo "[millionaire] WARNING: process exited immediately — check DATABASE_URL and logs"
  else
    echo "[millionaire] pid=$MILLIONAIRE_PID ready (or starting)"
  fi
else
  echo "[millionaire] server.js missing — /millionaire will return 503 HTML"
fi

cd /app/server
echo "[express] starting on PORT=${PORT:-3000}"
exec node index.js
