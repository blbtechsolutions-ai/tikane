#!/bin/sh
set -eu

PORT="${PORT:-3000}"
LISTEN_DIRECTIVES="listen ${PORT};"

if [ "${PORT}" != "3000" ]; then
  LISTEN_DIRECTIVES="${LISTEN_DIRECTIVES}
  listen 3000;"
fi

awk -v listen="${LISTEN_DIRECTIVES}" '{ gsub(/\$\{LISTEN_DIRECTIVES\}/, listen); print }' \
  /etc/nginx/app-templates/default.conf.template > /etc/nginx/conf.d/default.conf

cat > /usr/share/nginx/html/env.js <<EOF
window.__env = {
  API_URL: "${API_URL:-/api/v1}"
};
EOF
