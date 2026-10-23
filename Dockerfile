# ==========================================
# 1. Build Stage
# ==========================================
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ==========================================
# 2. Production Runner Stage
# ==========================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled application from builder
COPY --from=builder /app/dist ./dist

# Copy orders data directory and set permissions
COPY data ./data
RUN chown -R node:node /app

USER node

EXPOSE 4000

VOLUME ["/app/data"]

CMD ["node", "dist/computer-shop/server/server.mjs"]
