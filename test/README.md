# API Endpoint Testing

This directory contains the infrastructure for testing all API endpoints in the application.

## Available Endpoints

Total endpoints: 66 across 10 controllers

1. Auth Controller (4 endpoints)

   - POST /auth/login
   - POST /auth/register
   - POST /auth/register/admin
   - GET /auth/profile

2. Health Controller (2 endpoints)

   - GET /health
   - GET /health/dev-token

3. Prestamos Controller (17 endpoints)

   - Regular Loan Operations (8)
   - Migration Operations (4)
   - Monitoring Operations (3)
   - Test Data Operations (2)

4. Juntas Controller (5 endpoints)

   - POST /juntas
   - GET /juntas
   - GET /juntas/:id
   - DELETE /juntas/:id
   - POST /juntas/:id/members

5. Users Controller (5 endpoints)

   - GET /users
   - GET /users/me
   - GET /users/:id
   - PUT /users/:id/role
   - POST /users/webhook

6. Multas Controller (5 endpoints)

   - POST /multas
   - GET /multas/junta/:juntaId
   - GET /multas/:id
   - PUT /multas/:id
   - DELETE /multas/:id

7. Agenda Controller (5 endpoints)

   - POST /agenda
   - GET /agenda/junta/:juntaId
   - GET /agenda/:id
   - PUT /agenda/:id
   - DELETE /agenda/:id

8. Acciones Controller (6 endpoints)

   - POST /acciones
   - GET /acciones/junta/:juntaId
   - GET /acciones/user
   - GET /acciones/:id
   - PUT /acciones/:id
   - DELETE /acciones/:id

9. Members Controller (8 endpoints)

   - GET /members/junta/:juntaId
   - GET /members/dni/:documentNumber
   - GET /members/dni/:documentNumber/prestamos
   - GET /members/dni/:documentNumber/multas
   - GET /members/dni/:documentNumber/acciones
   - GET /members/dni/:documentNumber/pagos
   - POST /members/:juntaId/add/:documentNumber
   - DELETE /members/:juntaId/:memberId

10. Capital Controller (9 endpoints)
    - Capital Social (3)
    - Ingreso Capital (3)
    - Gasto Capital (3)

## Running Tests

You can run tests for all endpoints or specific groups using the following npm scripts:

```bash
# Test all endpoints
npm run test:endpoints

# Test specific endpoint groups
npm run test:endpoints:auth
npm run test:endpoints:health
npm run test:endpoints:prestamos
npm run test:endpoints:juntas
npm run test:endpoints:users
npm run test:endpoints:multas
npm run test:endpoints:agenda
npm run test:endpoints:acciones
npm run test:endpoints:members
npm run test:endpoints:capital
```

## Test Files

1. `endpoints.list.ts` - Documentation of all endpoints with their methods, paths, and descriptions
2. `endpoints.helper.ts` - Helper functions for testing endpoints
3. `endpoints.e2e-spec.ts` - E2E test suite for all endpoints
4. `run-endpoint-tests.ts` - CLI script for running endpoint tests

## Test Output

The test output includes:

1. Individual endpoint results (✓ or ✗)
2. Group success rates
3. Overall statistics:
   - Total endpoints tested
   - Number of successful tests
   - Number of failed tests
   - Overall success rate
4. List of any failed endpoints

## Adding New Endpoints

When adding new endpoints:

1. Add the endpoint to `endpoints.list.ts`
2. Add test payload in `endpoints.helper.ts` if needed
3. The endpoint will automatically be included in the test suite

## Authentication

The test helper automatically handles authentication for protected endpoints. It will:

1. Authenticate before testing protected endpoints
2. Include the auth token in requests
3. Handle admin-only endpoint restrictions
