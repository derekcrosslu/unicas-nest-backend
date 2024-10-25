# Las Unicas Backend

NestJS backend with Prisma ORM, Clerk authentication, and role-based access control.

## Features

- Role-based access control (Admin, Facilitator, Member, User)
- Authentication using Clerk
- Database integration with Supabase using Prisma ORM
- Docker support for local development and deployment
- API documentation with Swagger
- Health check endpoint
- Webhook support for user synchronization

## Prerequisites

- Node.js v18 or later
- Docker and Docker Compose (for local development)
- Clerk account and credentials
- Supabase database

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[database]

# Clerk
CLERK_API=https://api.clerk.com
CLERK_PUBLIC_KEY=your_public_key
CLERK_FRONTEND_API_URL=your_frontend_api_url
CLERK_JWKS_URL=your_jwks_url
CLERK_SECRET_KEY=your_secret_key
CLERK_WEBHOOK_SECRET=your_webhook_secret

# Frontend
FRONTEND_URL=http://localhost:3001
```

## Local Development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Generate Prisma client:

   ```bash
   npm run prisma:generate
   ```

3. Push database schema:

   ```bash
   npm run prisma:push
   ```

4. Start the development server:
   ```bash
   npm run start:dev
   ```

Or using Docker:

```bash
docker-compose up
```

## API Documentation

Once the application is running, visit `/docs` for the Swagger API documentation.

## Authentication

The backend uses Clerk for authentication. All requests (except health check and webhook) must include a Bearer token:

```bash
Authorization: Bearer <clerk_session_token>
```

## Role-Based Access Control

- **Admin**: Full access to all features

  - Can create and view all juntas
  - Can manage user roles
  - Can add members to any junta

- **Facilitator**: Limited management access

  - Can create juntas
  - Can view and manage juntas they created
  - Can add members to juntas they manage

- **Member**: Basic access

  - Can view juntas they are members of
  - Cannot create or manage juntas

- **User**: Minimal access
  - Can only view public information
  - Must be added to juntas by admins or facilitators

## Deployment to Railway.app

1. Create a new project on Railway.app

2. Add the following environment variables in Railway:

   - `DATABASE_URL`
   - `CLERK_API`
   - `CLERK_PUBLIC_KEY`
   - `CLERK_FRONTEND_API_URL`
   - `CLERK_JWKS_URL`
   - `CLERK_SECRET_KEY`
   - `CLERK_WEBHOOK_SECRET`
   - `FRONTEND_URL`

3. Connect your GitHub repository to Railway:

   ```bash
   # Install Railway CLI
   npm i -g @railway/cli

   # Login to Railway
   railway login

   # Link your project
   railway link

   # Deploy your application
   railway up
   ```

4. Railway will automatically build and deploy your application using the Dockerfile

## Available Scripts

- `npm run start:dev` - Start the development server
- `npm run build` - Build the application
- `npm run start:prod` - Start the production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:push` - Push schema changes to the database
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:e2e` - Run end-to-end tests

## Project Structure

```
src/
├── auth/           # Authentication and authorization
├── users/          # User management
├── juntas/         # Juntas (meetings) management
├── prisma/         # Database configuration
├── config/         # Application configuration
└── health/         # Health check endpoint
```

## API Endpoints

### Users

- `POST /api/users/webhook` - Handle Clerk webhooks
- `GET /api/users/me` - Get current user profile
- `GET /api/users/:id` - Get user by ID (Admin only)
- `PUT /api/users/:id/role` - Update user role (Admin only)

### Juntas

- `POST /api/juntas` - Create a new junta (Admin, Facilitator)
- `GET /api/juntas` - List juntas (filtered by role)
- `GET /api/juntas/:id` - Get specific junta
- `POST /api/juntas/:id/members` - Add member to junta (Admin, Facilitator)

### Health

- `GET /api/health` - Health check endpoint

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
