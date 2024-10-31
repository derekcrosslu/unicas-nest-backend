### Testing Instructions:

1. Authentication Setup:

   - First, execute the "Register Admin" request to create an admin user
   - Then execute either "Login with email" or "Login with phone number"
   - The auth token will be automatically captured and used for subsequent requests
   - You can also register regular users with or without email

2. Test user creation and roles:

   - Use the admin token to access protected routes
   - Test role-based access control
   - Update user roles as needed

3. Test junta creation:

   - Create a new junta
   - Note the junta ID from the response
   - Use this ID in other requests that need JUNTA_ID

4. Test member operations:
   - For new members: Use the "Add new member to junta" endpoint
   - Make sure the document_number in the URL matches exactly with the one in the request body
   - Test member-specific endpoints
   - Test financial operations

Note: Replace placeholders:

- USER_ID: Use actual user ID
- JUNTA_ID: Use actual junta ID
- MEMBER_ID: Use actual member ID

### For reference, here's the full test-auth.http content that you can use later:

### Important Notes:

# 1. Backend runs on http://localhost:3000

# 2. Frontend runs on http://localhost:3001

# 3. All API requests should go to http://localhost:3000/api/...

# 4. Set up:

# - Execute "Register Admin" request first

# - Then "Login" with email or phone to get admin token

# - Token will be automatically used for subsequent requests
