# Las Unicas Backend

NestJS backend for Las Unicas application with role-based access control and comprehensive financial management features.

## Features

- Role-based access control (Admin, Facilitator, Member, User)
- Junta management
- Member management
- Financial operations (Prestamos, Multas, Acciones)
- Capital social management
- Agenda management
- Clerk authentication integration
- Supabase database integration

## Prerequisites

- Node.js v20 or later
- npm v9 or later
- PostgreSQL (production) / SQLite (development)
- Clerk account for authentication
- Supabase account for database

## Environment Variables

Create a `.env` file with:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Clerk Authentication
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_FRONTEND_API_URL=your_clerk_frontend_api_url
CLERK_JWKS_URL=your_clerk_jwks_url

# Frontend URL
FRONTEND_URL=http://localhost:3001

# Environment
NODE_ENV=development
```

## Installation

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Start development server
npm run start:dev
```

## API Documentation

Access Swagger documentation at: `http://localhost:3000/docs`

## Role-Based Access

1. Admin

   - Full access to all juntas and operations
   - Can manage users and roles
   - Can perform all financial operations

2. Facilitator

   - Can create and manage own juntas
   - Access limited to created juntas
   - Can manage members in own juntas

3. Member

   - Access limited to joined juntas
   - Can view junta details and participate
   - Limited financial operations

4. User
   - Basic access only
   - Can be added as member to juntas

## Docker Deployment

```bash
# Build image
docker build -t las-unicas-backend .

# Run container
docker run -p 3000:3000 --env-file .env las-unicas-backend
```

## Railway.app Deployment

1. Push code to GitHub repository
2. Connect repository to Railway.app
3. Set environment variables in Railway dashboard
4. Deploy application

## Development

```bash
# Run tests
npm run test

# Run linter
npm run lint

# Format code
npm run format
```

## API Endpoints

### Users

- `POST /api/users` - Create user
- `GET /api/users/me` - Get current user
- `PUT /api/users/:id/role` - Update user role

### Juntas

- `POST /api/juntas` - Create junta
- `GET /api/juntas` - List juntas
- `GET /api/juntas/:id` - Get junta details

### Members

- `POST /api/members/:juntaId/add/:documentNumber` - Add member
- `GET /api/members/:juntaId` - List members
- `DELETE /api/members/:juntaId/:memberId` - Remove member

### Financial

- `POST /api/prestamos` - Create loan
- `POST /api/multas` - Create fine
- `POST /api/acciones` - Create action
- `POST /api/capital/social` - Create capital social

### Agenda

- `POST /api/agenda` - Create agenda item
- `GET /api/agenda/junta/:juntaId` - List agenda items

## Database Schema

Key entities:

- User
- Junta
- JuntaMember
- Prestamo
- Multa
- Accion
- AgendaItem
- CapitalSocial
- IngresoCapital
- GastoCapital

## Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create pull request

## License

MIT License
