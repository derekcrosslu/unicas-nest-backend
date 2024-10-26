FROM node:18-alpine3.18

# Install system dependencies
RUN apk update && \
    apk add --no-cache \
    postgresql-client \
    postgresql-libs \
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
    if psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\\q" > /dev/null 2>&1; then\n\
        return 0\n\
    else\n\
        return 1\n\
    fi\n\
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
        echo "User: $POSTGRES_USER"\n\
        echo "Database: $POSTGRES_DB"\n\
        exit 1\n\
    fi\n\
\n\
    echo "Attempt $i/$MAX_RETRIES: PostgreSQL is not ready yet..."\n\
    sleep $RETRY_INTERVAL\n\
done\n\
\n\
# Run database migrations\n\
echo "Running database migrations..."\n\
if npx prisma migrate deploy; then\n\
    echo "Database migrations completed successfully"\n\
else\n\
    echo "Error: Database migration failed"\n\
    echo "Checking database connection..."\n\
    psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT version();" || true\n\
    exit 1\n\
fi\n\
\n\
# Generate Prisma Client\n\
echo "Generating Prisma Client..."\n\
if npx prisma generate; then\n\
    echo "Prisma Client generated successfully"\n\
else\n\
    echo "Error: Prisma Client generation failed"\n\
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

CMD ["/app/start.sh"]
