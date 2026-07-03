#!/usr/bin/env bash
# Apply clean Traefik labels on the Dokploy server.
# Run as root on the server after git pull / copy docker-compose.yml.
set -euo pipefail

COMPOSE_FILE="${1:-/etc/dokploy/applications/mltcenters-frontendmltcenter-ib2evs/code/docker-compose.yml}"

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "ERROR: $COMPOSE_FILE not found"
  exit 1
fi

echo "=== Before: Traefik labels in $COMPOSE_FILE ==="
grep -n 'traefik\.' "$COMPOSE_FILE" || echo "(none)"

echo ""
echo "=== Redeploy from Dokploy UI or run stack update on this host ==="
echo "After redeploy, verify:"
echo "  curl -sI https://www.mltcenters.com/ | head -3"
echo "  docker service inspect mltcenters-frontendmltcenter-ib2evs --format '{{json .Spec.Labels}}' | tr ',' '\\n' | grep traefik"
