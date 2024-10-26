FROM node:18-alpine3.18

# Install system dependencies
RUN apk update && \
    apk add --no-cache \
    postgresql-client \
    bash \
    curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Create startup script with better error handling
RUN echo '#!/bin/bash\n\
\n\
MAX_RETRIES=30\n\
RETRY_INTERVAL=2\n\
\n\
echo "Waiting for PostgreSQL to start..."\n\
\n\
for i in $(seq 1 $MAX_RETRIES); do\n\
    if pg_isready -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER; then\n\
        echo "PostgreSQL is ready!"\n\
        break\n\
    fi\n\
\n\
    if [ $i -eq $MAX_RETRIES ]; then\n\
        echo "Error: PostgreSQL did not become ready in time"\n\
        exit 1\n\
    fi\n\
\n\
    echo "Attempt $i/$MAX_RETRIES: PostgreSQL is not ready yet..."\n\
    sleep $RETRY_INTERVAL\n\
done\n\
\n\
echo "Running database migrations..."\n\
if ! npx prisma migrate deploy; then\n\
    echo "Error: Failed to run database migrations"\n\
    exit 1\n\
fi\n\
\n\
echo "Starting the application..."\n\
exec npm run start:prod' > /app/start.sh

RUN chmod +x /app/start.sh

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

CMD ["/app/start.sh"]
