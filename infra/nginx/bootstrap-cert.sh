#!/bin/sh
# Generates a self-signed placeholder certificate so nginx can start on :443
# before certbot has issued the real Let's Encrypt cert. certbot writes the real
# cert to the same path and a reload picks it up (see scripts/init-tls.sh).
set -e

DOMAIN="${TLS_DOMAIN:-daffatrg.me}"
LIVE="/etc/letsencrypt/live/$DOMAIN"

if [ ! -f "$LIVE/fullchain.pem" ]; then
    echo "bootstrap-cert: no cert for $DOMAIN, generating a self-signed placeholder"
    mkdir -p "$LIVE"
    openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
        -keyout "$LIVE/privkey.pem" \
        -out "$LIVE/fullchain.pem" \
        -subj "/CN=$DOMAIN" 2>/dev/null
fi
