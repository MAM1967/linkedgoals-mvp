# LinkedIn OAuth Working Configuration

## Current Working Setup (Production Verified)

This document describes the **actual working configuration** for LinkedIn OAuth integration in the LinkedGoals application.

⚠️ **IMPORTANT**: This configuration is currently working in production. Do not change it without thorough testing.

## LinkedIn Developer App Configuration

### Required Products
- ✅ **"Sign In with LinkedIn using OpenID Connect"** (REQUIRED)

### OAuth 2.0 Scopes
- ✅ `openid` - Required for OpenID Connect flow
- ✅ `profile` - Access to basic profile information  
- ✅ `email` - Access to email address

### Authorized Redirect URLs
- **Production**: `https://app.linkedgoals.app/linkedin`
- **Staging**: `https://linkedgoals-staging.web.app/linkedin`
- **Development**: `https://linkedgoals-development.web.app/linkedin`
- **Local**: `http://localhost:5173/linkedin`

## Frontend Implementation (LinkedInLogin.tsx)

```typescript
// Working configuration - DO NOT CHANGE
const LINKEDIN_SCOPES = "openid profile email";

const handleLinkedInLogin = async () => {
  const state = Math.random().toString(36).substring(7);
  sessionStorage.setItem("linkedin_oauth_state", state);

  const authUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("client_id", LINKEDIN_CLIENT_ID);
  authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.append("state", state);
  authUrl.searchParams.append("scope", LINKEDIN_SCOPES);

  window.location.href = authUrl.toString();
};
```

## Backend Implementation (Cloud Functions)

```typescript
// Working API endpoint - DO NOT CHANGE
const userInfoResponse = await axios.get(
  "https://api.linkedin.com/v2/userinfo",  // OpenID Connect endpoint
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
);
```

## Environment Configuration

### Frontend Environment Variables
```bash
VITE_LINKEDIN_CLIENT_ID=7880c93kzzfsgj
VITE_LINKEDIN_REDIRECT_URI=https://app.linkedgoals.app/linkedin  # Production
```

### Backend Secrets (Firebase Functions)
```bash
LINKEDIN_CLIENT_SECRET=<secret_value>
LINKEDIN_CLIENT_ID=7880c93kzzfsgj
```

## Multi-Environment Support

The current implementation supports multiple environments through:

1. **Dynamic Redirect URI Detection**: Based on hostname
2. **Environment-Specific Firebase Configs**: Separate configs for dev/staging/prod
3. **CORS Configuration**: Allows all environment domains

### Working Environment Detection
```typescript
// Frontend - Dynamic redirect URI
const getRedirectUri = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    if (hostname.includes('linkedgoals-development')) {
      return `${protocol}//${hostname}/linkedin`;
    }
    if (hostname.includes('linkedgoals-staging')) {
      return `${protocol}//${hostname}/linkedin`;
    }
    if (hostname === 'localhost') {
      return `${protocol}//${hostname}:${window.location.port}/linkedin`;
    }
    return "https://app.linkedgoals.app/linkedin"; // Production fallback
  }
  return "https://app.linkedgoals.app/linkedin";
};
```

```typescript
// Backend - Environment detection from origin
const origin = req.get('origin') || req.get('referer') || '';
let redirectUri = "https://app.linkedgoals.app/linkedin"; // Default

if (origin.includes('linkedgoals-staging.web.app')) {
  redirectUri = "https://linkedgoals-staging.web.app/linkedin";
} else if (origin.includes('linkedgoals-development.web.app')) {
  redirectUri = "https://linkedgoals-development.web.app/linkedin";
} else if (origin.includes('localhost')) {
  redirectUri = "http://localhost:5173/linkedin";
}
```

## Why This Configuration Works

1. **OpenID Connect**: LinkedIn's recommended approach for user authentication
2. **Single Endpoint**: `/v2/userinfo` provides all needed user data
3. **Standard OAuth Flow**: No PKCE complexity
4. **Environment Agnostic**: Same backend function handles all environments

## Troubleshooting

### If Login Fails
1. **Check LinkedIn App Settings**: Ensure redirect URIs are exactly configured
2. **Verify Scopes**: Must include `openid` for OpenID Connect
3. **Check CORS**: Ensure origin is in allowed CORS list
4. **Validate Secrets**: Ensure `LINKEDIN_CLIENT_SECRET` is set in Firebase Functions

### Common Errors
- **"invalid_redirect_uri"**: Redirect URI not configured in LinkedIn app
- **"invalid_scope"**: Missing `openid` scope
- **CORS errors**: Origin not in CORS allowlist

## Testing Checklist

Before making any changes to LinkedIn OAuth:
- [ ] Test login on production
- [ ] Test login on staging  
- [ ] Test login on localhost
- [ ] Verify user data is correctly retrieved
- [ ] Check Firebase Auth token creation
- [ ] Validate session persistence

## Documentation Updates Needed

The following documentation files contain outdated information and should be updated:
- `docs/11-integrations.md` - Contains incorrect API v2 endpoint information
- Any references to LinkedIn API v2 endpoints should be updated to OpenID Connect

## Conclusion

This OpenID Connect configuration is working reliably in production. Any changes should be thoroughly tested in development and staging before deployment to production.