#!/usr/bin/env sh
# Obtain (or renew) the Let's Encrypt certificate for the site, using the ACME
# webroot that the nginx service serves on :80. Run once on the VPS after the
# stack is up and DNS for the domain points at this host. Re-run to renew.
#
#   ./scripts/init-tls.sh
#
# Requires: docker, ports 80 + 443 reachable from the internet, and the domain's
# A record pointing at this server. May need sudo depending on your Docker setup.
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
INFRA_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
ENV_FILE="${ENV_FILE:-$INFRA_DIR/.env}"

if [ -f "$ENV_FILE" ]; then
  set -a
  . "$ENV_FILE"
  set +a
fi

DOMAIN="${TLS_DOMAIN:-daffatrg.me}"
EMAIL="${TLS_EMAIL:-admin@$DOMAIN}"
STACK_NAME="${STACK_NAME:-jaga}"

mkdir -p /var/www/certbot /etc/letsencrypt

# First run: drop the self-signed placeholder so certbot owns the live dir.
if [ ! -f "/etc/letsencrypt/renewal/$DOMAIN.conf" ]; then
  rm -rf "/etc/letsencrypt/live/$DOMAIN" "/etc/letsencrypt/archive/$DOMAIN"
fi

# Add "-d www.$DOMAIN" here (and point www DNS at this host) to cover www too.
docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/www/certbot:/var/www/certbot \
  certbot/certbot certonly --webroot -w /var/www/certbot \
  -d "$DOMAIN" \
  --email "$EMAIL" --agree-tos --no-eff-email

# Reload nginx so it swaps the placeholder for the real cert.
docker service update --force "${STACK_NAME}_nginx" >/dev/null

echo "TLS ready for https://$DOMAIN"
echo "Renew later with: ./scripts/init-tls.sh   (Let's Encrypt certs last 90 days)"
