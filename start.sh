#!/bin/sh
set -e

echo "Starting application initialization..."

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting the application..."
exec npm run start:prod
