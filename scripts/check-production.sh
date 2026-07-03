#!/usr/bin/env bash
# Run on the Dokploy server (SSH) to diagnose www.mltcenters.com routing.
set -euo pipefail

echo "=== DNS ==="
dig +short www.mltcenters.com A || true

echo ""
echo "=== Who listens on 80/443 ==="
ss -tlnp | grep -E ':80 |:443 ' || true

echo ""
echo "=== Caddy mltcenters block ==="
if docker ps --format '{{.Names}}' | grep -q '^caddy$'; then
  docker exec caddy cat /etc/caddy/Caddyfile 2>/dev/null | grep -A3 'mltcenters' || echo "(no mltcenters block in Caddyfile)"
else
  echo "(no caddy container)"
fi

echo ""
echo "=== MLTCENTERS container ==="
APP=$(docker ps --format '{{.Names}}' | grep -i 'mltcenters-frontend' | head -1 || true)
if [[ -n "$APP" ]]; then
  echo "Container: $APP"
  docker logs "$APP" --tail 3 2>&1 || true
  echo "--- wget inside container ---"
  docker exec "$APP" wget -qO- http://127.0.0.1:3000/ 2>/dev/null | head -3 || echo "wget failed"
else
  echo "(mltcenters container not running)"
fi

echo ""
echo "=== Origin response (bypass Cloudflare) ==="
ORIGIN_IP=$(dig +short www.mltcenters.com A | head -1)
if [[ -n "$ORIGIN_IP" ]]; then
  curl -sk --resolve "www.mltcenters.com:443:${ORIGIN_IP}" -o /dev/null -w "HTTPS direct: %{http_code}\n" "https://www.mltcenters.com/" || true
  curl -s --resolve "www.mltcenters.com:80:${ORIGIN_IP}" -o /dev/null -w "HTTP direct: %{http_code}\n" "http://www.mltcenters.com/" || true
fi

echo ""
echo "Traefik 404 (body: '404 page not found') = no router for Host(www.mltcenters.com)."
echo "Fix: add deploy/caddy/mltcenters.snippet.caddy to /root/Caddyfile and reload Caddy."
