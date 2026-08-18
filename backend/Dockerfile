# ─── Stage 1: Build ───────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps && npm cache clean --force
COPY . .
RUN npm run prisma:generate
RUN npm run build

# ─── Stage 2: Development ─────────────────────────────────────
FROM node:20-alpine AS development

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps && npm cache clean --force
COPY . .
RUN npm run prisma:generate

EXPOSE 3000
CMD ["npm", "run", "dev"]

# ─── Stage 3: Production ──────────────────────────────────────
FROM node:20-alpine AS production

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 tikane

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

RUN chown -R tikane:nodejs /app
USER tikane

EXPOSE 3000
ENV NODE_ENV=production
CMD ["sh", "-c", "npm run prisma:migrate:prod && node dist/server.js"]
