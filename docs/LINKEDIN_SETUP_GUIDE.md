# LinkedIn OAuth Setup Guide

This guide will help you configure LinkedIn OAuth correctly based on the fixes implemented to resolve the "OpenID permission is not supported for PKCE flows" error.

## Problem Summary

The initial LinkedIn OAuth implementation had several issues:

1. **Wrong scopes**: Using OpenID Connect scopes (`openid profile email`) instead of LinkedIn v2 scopes
2. **PKCE complications**: LinkedIn's PKCE implementation requires special approval and causes "invalid_client" errors
3. **Wrong endpoints**: Using PKCE endpoints instead of standard OAuth endpoints

## Solution Implemented

Based on GitHub discussions (PocketBase #3799, FusionAuth #34), we've implemented:

1. ✅ **Correct LinkedIn v2 scopes**: `profile email`
2. ✅ **Standard OAuth flow**: No PKCE implementation
3. ✅ **Correct endpoints**: Standard LinkedIn v2 OAuth endpoints

## LinkedIn Developer App Configuration

### 1. Create LinkedIn Developer App

1. Go to [LinkedIn Developers](https://developer.linkedin.com/)
2. Create a new app or use your existing app
3. Add your company page (required for LinkedIn apps)

### 2. Configure OAuth Settings

In your LinkedIn app settings:

**Products Needed:**

- ✅ "Sign In with LinkedIn using OpenID Connect" (for profile and email access)

**OAuth 2.0 Scopes Required (V2 API):**

- ✅ `profile` (to read basic profile information)
- ✅ `email` (to read email address)

**Authorized Redirect URLs:**

- Production: `https://app.linkedgoals.app/linkedin`
- Development: `http://localhost:5173/linkedin`

### 3. Environment Variables

Update your `.env` file:

```bash
# LinkedIn OAuth Configuration (v2 API, no PKCE)
VITE_LINKEDIN_CLIENT_ID=your_client_id_here
VITE_LINKEDIN_REDIRECT_URI=https://app.linkedgoals.app/linkedin

# Firebase Function Secrets
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
LINKEDIN_REDIRECT_URI=https://app.linkedgoals.app/linkedin
```

## What Changed in the Implementation

### Frontend Changes:

1. **Scopes**: Changed from `"openid profile email"` to `"profile email"`
2. **PKCE Removed**: No more code challenge/verifier generation
3. **Standard OAuth**: Uses standard authorization flow

### Backend Changes:

1. **Token Exchange**: Removed PKCE parameters from token request
2. **API Endpoints**: Uses standard LinkedIn v2 API endpoints
3. **Error Handling**: Improved error messages

## Testing the Integration

1. **Deploy your updated code** to Firebase Hosting
2. **Update LinkedIn redirect URIs** to match your custom domain (`https://app.linkedgoals.app/linkedin`)
3. **Test the login flow**:
   - Click "Sign in with LinkedIn"
   - Authorize the app with `profile` and `email` scopes
   - Should redirect back and complete sign-in

## Troubleshooting

### Common Issues:

**"invalid_client" error:**

- ✅ Fixed by removing PKCE parameters
- ✅ Using correct client authentication method

**"OpenID permission is not supported" error:**

- ✅ Fixed by using LinkedIn v2 scopes instead of OpenID Connect scopes

**"Redirect URI mismatch" error:**

- Ensure redirect URI in LinkedIn app matches exactly: `https://app.linkedgoals.app/linkedin`
- Include protocol (https://) and path (/linkedin)

### If Issues Persist:

1. Check LinkedIn app is approved for your company page
2. Verify all redirect URIs are correctly configured
3. Ensure you're using LinkedIn v2 API scopes (`profile` and `email`)
4. Check Firebase Function logs for detailed error messages

## References

- [LinkedIn OAuth 2.0 Documentation](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
- [PocketBase GitHub Discussion #3799](https://github.com/pocketbase/pocketbase/discussions/3799)
- [FusionAuth GitHub Issue #34](https://github.com/FusionAuth/fusionauth-issues/issues/34)

The implementation now follows LinkedIn's standard OAuth 2.0 flow without PKCE complications, which should resolve all the authentication issues you were experiencing.
