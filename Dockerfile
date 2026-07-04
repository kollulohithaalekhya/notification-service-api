# ─────────────────────────────────────────────────────────────
# Stage 1 — builder
# Installs ALL dependencies and compiles TypeScript → JavaScript.
# This stage is discarded in the final image, keeping production
# images lean and free of dev tooling.
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first — layer-caches npm install until
# package.json or package-lock.json actually change.
COPY package*.json ./

RUN npm ci

# Copy source and compile
COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ─────────────────────────────────────────────────────────────
# Stage 2 — production
# Starts from a clean base; only the compiled JS and production
# node_modules are copied in.  Dev tools (ts-node-dev, jest, etc.)
# are NOT present, reducing the attack surface and image size.
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Install curl for the Docker health check command
RUN apk add --no-cache curl

COPY package*.json ./

# --omit=dev ensures only production dependencies are installed
RUN npm ci --omit=dev

# Copy compiled output from the builder stage
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/server.js"]
