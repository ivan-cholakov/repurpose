# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# ---- Install dependencies (cached while the lockfile is unchanged) ----
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ---- Build the standalone server ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# AUTH_SECRET is only needed to satisfy build-time env validation; the real
# secret is provided at runtime.
RUN AUTH_SECRET=docker-build-placeholder-0123456789 pnpm build
# Next bundles server deps into the build, so the standalone node_modules has
# no drizzle-orm — yet scripts/migrate.mjs needs it at container start.
# Dereference the pnpm symlink so the runner gets a plain copy.
RUN cp -rL node_modules/drizzle-orm /tmp/drizzle-orm

# ---- Minimal runtime image ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    DATABASE_URL="file:/app/data/repurpose.db"
RUN addgroup -S -g 1001 nodejs \
 && adduser -S -u 1001 -G nodejs nextjs \
 && mkdir -p /app/data \
 && chown nextjs:nodejs /app/data

COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

# Migration runner: SQL files + journal, the script, and its only un-traced dep.
COPY --from=build --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=build --chown=nextjs:nodejs /app/scripts/migrate.mjs ./scripts/migrate.mjs
COPY --from=build --chown=nextjs:nodejs /tmp/drizzle-orm ./node_modules/drizzle-orm
COPY --chmod=755 scripts/docker-entrypoint.sh ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000
VOLUME /app/data
ENTRYPOINT ["./docker-entrypoint.sh"]
