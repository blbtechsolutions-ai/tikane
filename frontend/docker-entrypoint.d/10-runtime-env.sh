#!/bin/sh
set -eu

PORT="${PORT:-80}"
sed "s|\${PORT}|${PORT}|g" /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

cat > /usr/share/nginx/html/env.js <<EOF
window.__env = {
  API_URL: "${API_URL:-/api/v1}"
};
EOF
