#!/bin/sh
# Container entrypoint: apply pending Drizzle migrations, then start the
# standalone Next.js server. Set AUTO_MIGRATE=false to skip migrations
# (e.g. when a separate job owns the schema).
set -e

if [ "${AUTO_MIGRATE:-true}" != "false" ]; then
  node scripts/migrate.mjs
fi

exec node server.js
