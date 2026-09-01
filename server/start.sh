#!/bin/sh
set -e

# Persistent mount for large program video (see docs/DEPLOY_PROGRAM_VIDEO.md).
mkdir -p /app/dist/assets/video

# Start Next.js TOEIC game (in-memory questions — no DATABASE_URL required).
# Do NOT export PORT into this shell — Express must keep Dokploy PORT (3000).
if [ -f /app/millionaire/server.js ]; then
  echo "[millionaire] starting on :3002 (basePath /millionaire, memory question bank)"
  (
    cd /app/millionaire
    PORT=3002 HOSTNAME=0.0.0.0 node server.js
  ) &
  MILLIONAIRE_PID=$!
  sleep 1
  if ! kill -0 "$MILLIONAIRE_PID" 2>/dev/null; then
    echo "[millionaire] WARNING: process exited immediately — check logs"
  else
    echo "[millionaire] pid=$MILLIONAIRE_PID ready (or starting)"
  fi
else
  echo "[millionaire] server.js missing — /millionaire will return 503 HTML"
fi

cd /app/server
echo "[express] starting on PORT=${PORT:-3000}"
exec node index.js
