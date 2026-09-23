#!/bin/sh
set -eu

echo "Applying Prisma migrations..."
node ./node_modules/prisma/build/index.js migrate deploy

echo "Checking initial administrator..."
./node_modules/.bin/tsx prisma/bootstrap-admin.ts

echo "Starting Casla Assets..."
exec node ./node_modules/next/dist/bin/next start -H 0.0.0.0 -p 3000
