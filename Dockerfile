FROM node:18-alpine3.18

# Install system dependencies
RUN apk update && \
    apk add --no-cache \
    postgresql15-client \
    bash \
    curl \
    jq \
    tzdata

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with specific npm version
RUN npm install -g npm@9.8.1 && \
    npm ci

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Create startup script with better error handling and database initialization
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
MAX_RETRIES=60\n\
RETRY_INTERVAL=2\n\
\n\
echo "[$(date)] Starting application initialization..."\n\
\n\
# Function to check database connection\n\
check_db() {\n\
    PGPASSWORD=$POSTGRES_PASSWORD psql \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        -c "SELECT 1" > /dev/null 2>&1\n\
}\n\
\n\
# Wait for database\n\
echo "[$(date)] Waiting for PostgreSQL to start..."\n\
for i in $(seq 1 $MAX_RETRIES); do\n\
    if check_db; then\n\
        echo "[$(date)] Successfully connected to PostgreSQL!"\n\
        break\n\
    fi\n\
\n\
    if [ $i -eq $MAX_RETRIES ]; then\n\
        echo "[$(date)] Error: Could not connect to PostgreSQL after $MAX_RETRIES attempts"\n\
        exit 1\n\
    fi\n\
\n\
    echo "[$(date)] Attempt $i/$MAX_RETRIES: PostgreSQL is not ready yet..."\n\
    sleep $RETRY_INTERVAL\n\
done\n\
\n\
# Verify DATABASE_URL is set\n\
if [ -z "$DATABASE_URL" ]; then\n\
    echo "[$(date)] Error: DATABASE_URL is not set"\n\
    exit 1\n\
fi\n\
\n\
# Run database migrations\n\
echo "[$(date)] Running database migrations..."\n\
if npx prisma migrate deploy; then\n\
    echo "[$(date)] Database migrations completed successfully"\n\
else\n\
    echo "[$(date)] Error: Database migration failed"\n\
    exit 1\n\
fi\n\
\n\
# Generate Prisma Client\n\
echo "[$(date)] Generating Prisma Client..."\n\
if npx prisma generate; then\n\
    echo "[$(date)] Prisma Client generated successfully"\n\
else\n\
    echo "[$(date)] Error: Prisma Client generation failed"\n\
    exit 1\n\
fi\n\
\n\
echo "[$(date)] Starting the application..."\n\
exec npm run start:prod' > /app/start.sh

RUN chmod +x /app/start.sh

EXPOSE 3000

# Health check with increased timeout
HEALTHCHECK --interval=30s --timeout=30s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

CMD ["/app/start.sh"]
