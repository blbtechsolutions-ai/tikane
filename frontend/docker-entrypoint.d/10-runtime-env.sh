#!/bin/sh
set -eu

cat > /usr/share/nginx/html/env.js <<EOF
window.__env = {
  API_URL: "${API_URL:-/api/v1}"
};
EOF
