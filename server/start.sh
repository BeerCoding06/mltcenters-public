#!/bin/sh
set -e

# Start Next.js TOEIC game (internal)
if [ -f /app/millionaire/server.js ]; then
  echo "[millionaire] starting on :3002 (basePath /millionaire)"
  PORT=3002 HOSTNAME=0.0.0.0 node /app/millionaire/server.js &
else
  echo "[millionaire] server.js missing — /millionaire will return 503"
fi

# Start Express (public)
cd /app/server
exec node index.js
