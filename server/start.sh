#!/bin/sh
set -e

# Start Next.js TOEIC game (internal) — must listen before Express proxies to it
if [ -f /app/millionaire/server.js ]; then
  echo "[millionaire] starting on :3002 (basePath /millionaire)"
  cd /app/millionaire
  export PORT=3002
  export HOSTNAME=0.0.0.0
  # Next standalone inherits DATABASE_URL / DIRECT_URL / OPENAI_* from container env
  node server.js &
  MILLIONAIRE_PID=$!
  # Brief wait so Express proxy does not race a cold start
  sleep 1
  if ! kill -0 "$MILLIONAIRE_PID" 2>/dev/null; then
    echo "[millionaire] WARNING: process exited immediately — check DATABASE_URL and logs"
  else
    echo "[millionaire] pid=$MILLIONAIRE_PID ready (or starting)"
  fi
  cd /app/server
else
  echo "[millionaire] server.js missing — /millionaire will return 503 HTML"
fi

# Start Express (public)
cd /app/server
exec node index.js
