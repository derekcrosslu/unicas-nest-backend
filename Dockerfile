FROM node:18-alpine3.18 as builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# Copy source code and build
COPY . .
RUN npm run build

# Production image
FROM node:18-alpine3.18

# Install minimal production dependencies
RUN apk add --no-cache \
    curl \
    tzdata \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create startup script
RUN echo '#!/bin/sh\n\
set -e\n\
\n\
echo "Starting application initialization..."\n\
\n\
# Run database migrations\n\
echo "Running database migrations..."\n\
if npx prisma migrate deploy; then\n\
    echo "Database migrations completed successfully"\n\
else\n\
    echo "Error: Database migration failed"\n\
    exit 1\n\
fi\n\
\n\
echo "Starting the application..."\n\
exec npm run start:prod' > /app/start.sh

RUN chmod +x /app/start.sh

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Set environment variables
ENV NODE_ENV=production \
    TZ=UTC

CMD ["/app/start.sh"]
