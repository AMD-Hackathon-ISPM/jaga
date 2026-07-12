FROM nginx:stable-alpine

# openssl is needed by the bootstrap-cert entrypoint script.
RUN apk add --no-cache openssl

COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/default.conf /etc/nginx/conf.d/default.conf
COPY snippets/proxy_headers.conf /etc/nginx/snippets/proxy_headers.conf

# Runs before nginx starts (official image executes /docker-entrypoint.d/*.sh).
COPY bootstrap-cert.sh /docker-entrypoint.d/40-bootstrap-cert.sh
RUN chmod +x /docker-entrypoint.d/40-bootstrap-cert.sh
