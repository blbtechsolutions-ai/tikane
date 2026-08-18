# ─── Stage 1: Development ──────────────────────────────────────
FROM node:20-bookworm-slim AS development
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --include=optional && npm cache clean --force

COPY . .

EXPOSE 4200
CMD ["npx", "ng", "serve", "--host", "0.0.0.0", "--port", "4200", "--poll", "2000"]


# ─── Stage 2: Builder ──────────────────────────────────────────
FROM node:20-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --include=optional && npm cache clean --force

COPY . .
RUN npx ng build --configuration production


# ─── Stage 3: Production (Nginx) ───────────────────────────────
FROM nginx:1.25-alpine AS production
ENV PORT=3000

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.frontend.conf /etc/nginx/templates/default.conf.template
COPY docker-entrypoint.d/10-runtime-env.sh /docker-entrypoint.d/10-runtime-env.sh
RUN chmod +x /docker-entrypoint.d/10-runtime-env.sh

# Copy built app
COPY --from=builder /app/dist/tikane/browser /usr/share/nginx/html

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
