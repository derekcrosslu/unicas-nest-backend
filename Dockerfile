FROM node:18-alpine3.18 as builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client and build
RUN npx prisma generate && \
    npm run build

# Production image
FROM node:18-alpine3.18

# Install production dependencies
RUN apk update && \
    apk add --no-cache \
    postgresql-client \
    postgresql-libs \
    bash \
    curl \
    jq \
    tzdata \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create startup script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Set timezone\n\
export TZ=UTC\n\
\n\
MAX_RETRIES=30\n\
RETRY_INTERVAL=2\n\
\n\
echo "Starting application initialization..."\n\
\n\
# Function to check database connection\n\
check_db() {\n\
    export PGPASSWORD=$POSTGRES_PASSWORD\n\
    psql "postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}" -c "\\q" > /dev/null 2>&1\n\
}\n\
\n\
# Wait for database\n\
echo "Waiting for PostgreSQL to start..."\n\
for i in $(seq 1 $MAX_RETRIES); do\n\
    if check_db; then\n\
        echo "Successfully connected to PostgreSQL!"\n\
        break\n\
    fi\n\
\n\
    if [ $i -eq $MAX_RETRIES ]; then\n\
        echo "Error: Could not connect to PostgreSQL after $MAX_RETRIES attempts"\n\
        echo "Database connection details:"\n\
        echo "Host: $POSTGRES_HOST"\n\
        echo "Port: $POSTGRES_PORT"\n\
        echo "Database: $POSTGRES_DB"\n\
        exit 1\n\
    fi\n\
\n\
    echo "Attempt $i/$MAX_RETRIES: PostgreSQL is not ready yet..."\n\
    sleep $RETRY_INTERVAL\n\
done\n\
\n\
# Verify DATABASE_URL is set\n\
if [ -z "$DATABASE_URL" ]; then\n\
    echo "Error: DATABASE_URL is not set"\n\
    echo "Constructing DATABASE_URL from individual variables..."\n\
    export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public"\n\
fi\n\
\n\
echo "Using database URL: ${DATABASE_URL//:${POSTGRES_PASSWORD}@/:****@}"\n\
\n\
# Run database migrations\n\
echo "Running database migrations..."\n\
if npx prisma migrate deploy; then\n\
    echo "Database migrations completed successfully"\n\
else\n\
    echo "Error: Database migration failed"\n\
    echo "Checking database connection..."\n\
    psql "$DATABASE_URL" -c "SELECT version();" || true\n\
    exit 1\n\
fi\n\
\n\
echo "Starting the application..."\n\
exec npm run start:prod' > /app/start.sh

RUN chmod +x /app/start.sh

EXPOSE 3000

# Health check with increased timeout and better error handling
HEALTHCHECK --interval=30s --timeout=30s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || (echo "Health check failed" && exit 1)

# Set environment variables
ENV NODE_ENV=production \
    TZ=UTC

CMD ["/app/start.sh"]
