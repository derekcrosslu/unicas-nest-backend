FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache postgresql-client

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

# Create startup script
RUN echo '#!/bin/sh\n\
echo "Waiting for PostgreSQL to start..."\n\
while ! pg_isready -h $POSTGRES_HOST -p $POSTGRES_PORT -U $POSTGRES_USER; do\n\
  sleep 2;\n\
done\n\
\n\
echo "PostgreSQL is ready, running migrations..."\n\
npx prisma migrate deploy\n\
\n\
echo "Starting the application..."\n\
npm run start:prod' > /app/start.sh

RUN chmod +x /app/start.sh

EXPOSE 3000

CMD ["/app/start.sh"]
