#!/usr/bin/env bash
# Verify Traefik deploy.labels and prepare Swarm service for redeploy.
# Run on Dokploy server as root after git pull / sync docker-compose.yml.
set -euo pipefail

SERVICE="${SERVICE:-mltcenters-frontendmltcenter-ib2evs}"
COMPOSE_FILE="${COMPOSE_FILE:-/etc/dokploy/applications/${SERVICE}/code/docker-compose.yml}"

echo "=== Expected Traefik labels (deploy.labels) ==="
cat <<'EOF'
traefik.enable=true
traefik.docker.network=dokploy-network
traefik.http.routers.mltcenters.rule=Host(`mltcenters.com`,`www.mltcenters.com`)
traefik.http.routers.mltcenters.entrypoints=websecure
traefik.http.routers.mltcenters.tls=true
traefik.http.routers.mltcenters.tls.certresolver=letsencrypt
traefik.http.routers.mltcenters.service=mltcenters
traefik.http.services.mltcenters.loadbalancer.server.port=3000
EOF

if [[ -f "$COMPOSE_FILE" ]]; then
  echo ""
  echo "=== Labels in $COMPOSE_FILE ==="
  grep -n 'traefik\.' "$COMPOSE_FILE" || echo "(none)"
else
  echo ""
  echo "WARN: $COMPOSE_FILE not found — sync repo first"
fi

echo ""
echo "=== Labels on running Swarm service ==="
docker service inspect "$SERVICE" \
  --format '{{range $k,$v := .Spec.Labels}}{{$k}}={{$v}}{{"\n"}}{{end}}' \
  | grep '^traefik\.' || echo "(no traefik labels on service — redeploy required)"

echo ""
echo "=== Apply labels without full redeploy (optional) ==="
cat <<EOF
docker service update \\
  --label-rm traefik.http.routers.mltcenters.rule \\
  --label-add 'traefik.enable=true' \\
  --label-add 'traefik.docker.network=dokploy-network' \\
  --label-add 'traefik.http.routers.mltcenters.rule=Host(\`mltcenters.com\`,\`www.mltcenters.com\`)' \\
  --label-add 'traefik.http.routers.mltcenters.entrypoints=websecure' \\
  --label-add 'traefik.http.routers.mltcenters.tls=true' \\
  --label-add 'traefik.http.routers.mltcenters.tls.certresolver=letsencrypt' \\
  --label-add 'traefik.http.routers.mltcenters.service=mltcenters' \\
  --label-add 'traefik.http.services.mltcenters.loadbalancer.server.port=3000' \\
  $SERVICE
EOF

echo ""
echo "=== After redeploy, verify ==="
echo "curl -sI https://www.mltcenters.com/ | head -3"
