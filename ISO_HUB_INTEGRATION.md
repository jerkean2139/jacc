# ISO Hub Authentication Integration

## Overview
JACC now supports seamless authentication integration with ISO Hub server, allowing users logged into ISO Hub to automatically access JACC without separate login credentials.

## Integration Architecture

### Authentication Flow
1. User logs into ISO Hub frontend
2. ISO Hub provides authentication token
3. Token is passed to JACC via multiple methods
4. JACC verifies token with ISO Hub server
5. User data is synchronized between platforms
6. Automatic JACC session creation

## API Endpoints

### ISO Hub Server (Laravel Sanctum)
- **Base URL**: `https://iso-hub-server-1.keanonbiz.replit.dev/api`
- **Authentication**: Bearer token in Authorization header
- **Token Format**: `Authorization: Bearer {token}`

#### Available Endpoints:
- `POST /login` - User authentication
- `POST /register` - User registration  
- `GET /user` - Token verification and user data
- `GET /users/permissions/{user_id}` - User permissions

### JACC Integration Endpoints

#### Single Sign-On (SSO)
```http
POST /api/auth/iso-hub/sso
Content-Type: application/json

{
  "token": "iso_hub_bearer_token",
  "redirect_url": "/dashboard" // optional
}
```

#### Direct Login with Credentials
```http
POST /api/auth/iso-hub/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Token Verification
```http
GET /api/auth/iso-hub/verify
Authorization: Bearer {iso_hub_token}
```

## Implementation Methods

### Method 1: URL Parameter
```
https://jacc-tracer.replit.app?auth_token={iso_hub_token}
```

### Method 2: PostMessage API
```javascript
window.postMessage({
  type: 'ISO_HUB_AUTH',
  token: 'user_token_here',
  user: {user_object}
}, '*');
```

### Method 3: HTTP Request
Direct API call to JACC SSO endpoint with ISO Hub token.

## User Data Synchronization

### ISO Hub User Model
```typescript
interface ISOHubUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role_id: number;
}
```

### JACC User Model (Enhanced)
```typescript
interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isoHubId: string;    // New field
  isoHubToken: string; // New field
}
```

### Role Mapping
- ISO Hub Role ID 1 → JACC `admin`
- ISO Hub Role ID 2 → JACC `manager`
- ISO Hub Role ID 3 → JACC `agent`
- Default → JACC `user`

## Database Schema Updates

### Users Table
Added new fields for ISO Hub integration:
```sql
ALTER TABLE users ADD COLUMN iso_hub_id VARCHAR;
ALTER TABLE users ADD COLUMN iso_hub_token TEXT;
```

## Error Handling

### Standard Error Responses
- `400 MISSING_TOKEN` - Token not provided
- `401 INVALID_TOKEN` - Token verification failed
- `401 INVALID_CREDENTIALS` - Login credentials incorrect
- `500 AUTH_MIDDLEWARE_ERROR` - Internal authentication error

## Testing the Integration

### Test User Creation
1. Create test user in ISO Hub:
```http
POST https://iso-hub-server-1.keanonbiz.replit.dev/api/register
{
  "name": "Test User",
  "email": "test@example.com", 
  "password": "password123",
  "password_confirmation": "password123"
}
```

2. Login to get token:
```http
POST https://iso-hub-server-1.keanonbiz.replit.dev/api/login
{
  "email": "test@example.com",
  "password": "password123"
}
```

3. Use token with JACC SSO:
```http
POST /api/auth/iso-hub/sso
{
  "token": "received_bearer_token"
}
```

## Security Features

### Token Verification
- Real-time verification with ISO Hub server
- Automatic token refresh handling
- Secure token storage in JACC sessions

### Session Management
- Automatic JACC session creation
- ISO Hub token stored for subsequent API calls
- Session synchronization between platforms

## Frontend Integration Examples

### React Hook for ISO Hub Auth
```typescript
const useISOHubAuth = () => {
  const authenticateWithISOHub = async (token: string) => {
    const response = await fetch('/api/auth/iso-hub/sso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    return response.json();
  };
  
  return { authenticateWithISOHub };
};
```

### URL Parameter Handling
```typescript
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const authToken = urlParams.get('auth_token');
  
  if (authToken) {
    authenticateWithISOHub(authToken);
  }
}, []);
```

## Deployment Notes

1. Ensure ISO Hub server is accessible
2. Verify CORS settings allow cross-domain requests
3. Update environment variables if needed
4. Test token verification endpoint connectivity

## Troubleshooting

### Common Issues
- **401 Unauthorized**: Check token validity and format
- **CORS Errors**: Verify cross-domain request permissions  
- **Network Timeout**: Confirm ISO Hub server accessibility
- **User Not Found**: Ensure user exists in both systems

### Debug Endpoints
- Check ISO Hub connectivity: `GET /api/auth/iso-hub/verify?token=test`
- Monitor authentication logs in server console
- Verify database schema updates applied correctly

## Future Enhancements

1. **Permission Synchronization**: Real-time permission updates
2. **Token Refresh**: Automatic token renewal
3. **Audit Logging**: Track cross-platform authentication events
4. **Role-based Access**: Enhanced role mapping and restrictions