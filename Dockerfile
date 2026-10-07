# ----------------------------
# Stage 1: Install dependencies
# ----------------------------
FROM node:22-alpine AS deps

WORKDIR /app

# Enable pnpm v9 (avoids pnpm v10 build approval issue)
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# Copy dependency files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# ----------------------------
# Stage 2: Build application
# ----------------------------
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# Copy installed dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Release label shown in error reports and logs (e.g. the git SHA): docker build --build-arg NEXT_PUBLIC_APP_RELEASE=$(git rev-parse --short HEAD)
ARG NEXT_PUBLIC_APP_RELEASE=dev
ENV NEXT_PUBLIC_APP_RELEASE=$NEXT_PUBLIC_APP_RELEASE

# Build the application
RUN pnpm build

# ----------------------------
# Stage 3: Production image
# ----------------------------
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ARG NEXT_PUBLIC_APP_RELEASE=dev
ENV NEXT_PUBLIC_APP_RELEASE=$NEXT_PUBLIC_APP_RELEASE
# Set at container runtime (not build time): API_BASE_URL=http://<backend-host>:8080

# next.config.ts sets `output: "standalone"`: the build traces the actual
# runtime dependency graph and emits server.js + only the node_modules it
# needs (~37MB here vs. 700MB+ for the full node_modules this stage used to
# copy) — this is what was making every UAT push/pull slow. No pnpm needed
# at runtime either; server.js is a plain Node entrypoint.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
