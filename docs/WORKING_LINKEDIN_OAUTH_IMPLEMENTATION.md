# Working LinkedIn OAuth Implementation

## Summary

The LinkedGoals application successfully uses **LinkedIn's OpenID Connect** implementation for user authentication. This document describes the actual working setup.

## ✅ Current Working Configuration

### LinkedIn Developer App Settings

1. **Product**: "Sign In with LinkedIn using OpenID Connect"
2. **Scopes**: `openid profile email`
3. **Redirect URIs**:
   - Production: `https://app.linkedgoals.app/linkedin`
   - Staging: `https://linkedgoals-staging.web.app/linkedin`
   - Development: `https://linkedgoals-development.web.app/linkedin`
   - Local: `http://localhost:5173/linkedin`

### Frontend Implementation

**File**: `src/components/LinkedInLogin.tsx`

```typescript
// Working scopes
const LINKEDIN_SCOPES = "openid profile email";

// Dynamic redirect URI based on environment
const getRedirectUri = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    if (hostname.includes('linkedgoals-development') || hostname.includes('development')) {
      return `${protocol}//${hostname}/linkedin`;
    }
    if (hostname.includes('linkedgoals-staging') || hostname.includes('staging')) {
      return `${protocol}//${hostname}/linkedin`;
    }
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${protocol}//${hostname}:${window.location.port}/linkedin`;
    }
    return "https://app.linkedgoals.app/linkedin";
  }
  return "https://app.linkedgoals.app/linkedin";
};
```

### Backend Implementation

**File**: `functions/src/index.ts`

```typescript
// Working endpoint
const userInfoResponse = await axios.get(
  "https://api.linkedin.com/v2/userinfo",
  {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
);

// Environment-aware CORS and redirect URIs
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

## Environment Configuration

### Multi-Environment Setup

- **Production Functions**: `linkedgoals-d7053` (Blaze plan)
- **Staging Frontend**: `linkedgoals-staging` (Spark plan - hosting only)
- **Development Frontend**: `linkedgoals-development` (Spark plan - hosting only)

### Environment Variables

```bash
# Frontend (.env files)
VITE_LINKEDIN_CLIENT_ID=7880c93kzzfsgj
VITE_LINKEDIN_REDIRECT_URI=[environment-specific]

# Backend (Firebase Functions Secrets)
LINKEDIN_CLIENT_ID=7880c93kzzfsgj
LINKEDIN_CLIENT_SECRET=[secret]
```

## Deployment Strategy

Since only production has Blaze plan for Cloud Functions:

1. **Functions**: Deploy to production only
2. **Frontend**: Deploy to respective environments
3. **Cross-environment calls**: Staging/dev frontends call production functions

## Testing URLs

- **Production**: https://app.linkedgoals.app
- **Staging**: https://linkedgoals-staging.web.app
- **Development**: https://linkedgoals-development.web.app

## Key Success Factors

1. **OpenID Connect**: Using the correct LinkedIn product and scopes
2. **Environment Detection**: Dynamic redirect URIs based on hostname
3. **CORS Configuration**: Allowing all environment origins in functions
4. **Single Function Deployment**: Production functions handle all environments

## Common Issues Avoided

❌ **Don't use**: `profile email` scopes without `openid`
❌ **Don't use**: LinkedIn v2 API endpoints (`/v2/me`, `/v2/emailAddresses`)
❌ **Don't use**: PKCE flow (not needed for server-side apps)

✅ **Do use**: `openid profile email` scopes
✅ **Do use**: OpenID Connect endpoint (`/v2/userinfo`)
✅ **Do use**: Standard OAuth 2.0 flow