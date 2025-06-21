# LinkedIn OAuth Apps Setup Guide

This guide walks you through creating LinkedIn OAuth applications for all three environments (development, staging, production).

## 🔗 LinkedIn Developer Portal Setup

### Step 1: Access LinkedIn Developer Portal

1. Go to [LinkedIn Developer Portal](https://developer.linkedin.com/)
2. Sign in with your LinkedIn account
3. Click "Create App" (or "My Apps" if you already have apps)

## 🏗️ Create Apps for Each Environment

### 1. Production App (Already Configured) ✅

**App Name**: `LinkedGoals`
**Client ID**: `7880c93kzzfsgj`
**Status**: ✅ Already configured and working

**Settings**:
- **Authorized Redirect URLs**: 
  - `https://app.linkedgoals.app/linkedin`
- **Products**: 
  - "Sign In with LinkedIn using OpenID Connect"
- **OAuth 2.0 Scopes**: 
  - `profile`
  - `email`

### 2. Development App (To Be Created)

**App Name**: `LinkedGoals Development`
**Recommended Client ID**: `linkedgoals-dev-app` (LinkedIn will assign actual ID)

**Create Steps**:
1. Click "Create App"
2. Fill in app details:
   - **App name**: `LinkedGoals Development`
   - **LinkedIn Page**: (Select your company page or personal)
   - **App logo**: Upload LinkedGoals logo
   - **Legal agreement**: Check the box
3. Click "Create app"

**Configure Settings**:
1. Go to **Auth** tab
2. Add **Authorized Redirect URLs**:
   - `https://linkedgoals-dev.web.app/linkedin`
   - `http://localhost:5173/linkedin` (for local development)
3. Go to **Products** tab
4. Add "Sign In with LinkedIn using OpenID Connect"
5. In **OAuth 2.0 settings**, ensure scopes:
   - `profile`
   - `email`

### 3. Staging App (To Be Created)

**App Name**: `LinkedGoals Staging`
**Recommended Client ID**: `linkedgoals-staging-app` (LinkedIn will assign actual ID)

**Create Steps**:
1. Click "Create App"
2. Fill in app details:
   - **App name**: `LinkedGoals Staging`
   - **LinkedIn Page**: (Select your company page or personal)
   - **App logo**: Upload LinkedGoals logo
   - **Legal agreement**: Check the box
3. Click "Create app"

**Configure Settings**:
1. Go to **Auth** tab
2. Add **Authorized Redirect URLs**:
   - `https://linkedgoals-staging.web.app/linkedin`
3. Go to **Products** tab
4. Add "Sign In with LinkedIn using OpenID Connect"
5. In **OAuth 2.0 settings**, ensure scopes:
   - `profile`
   - `email`

## 📝 Environment Configuration Updates

After creating the LinkedIn apps, update your configuration files with the actual client IDs:

### Development Environment

Update `src/config/firebase-dev.ts`:
```typescript
export const environment = {
  // ... other config
  linkedinClientId: "YOUR_ACTUAL_DEV_CLIENT_ID", // Replace with real client ID
  linkedinRedirectUri: "https://linkedgoals-dev.web.app/linkedin",
  localRedirectUri: "http://localhost:5173/linkedin",
};
```

Update `.env.development`:
```bash
VITE_LINKEDIN_CLIENT_ID=YOUR_ACTUAL_DEV_CLIENT_ID
VITE_LINKEDIN_REDIRECT_URI=https://linkedgoals-dev.web.app/linkedin
```

### Staging Environment

Update `src/config/firebase-staging.ts`:
```typescript
export const environment = {
  // ... other config
  linkedinClientId: "YOUR_ACTUAL_STAGING_CLIENT_ID", // Replace with real client ID
  linkedinRedirectUri: "https://linkedgoals-staging.web.app/linkedin",
};
```

Update `.env.staging`:
```bash
VITE_LINKEDIN_CLIENT_ID=YOUR_ACTUAL_STAGING_CLIENT_ID
VITE_LINKEDIN_REDIRECT_URI=https://linkedgoals-staging.web.app/linkedin
```

### Production Environment (Already Configured) ✅

The production environment is already configured with:
- Client ID: `7880c93kzzfsgj`
- Redirect URI: `https://app.linkedgoals.app/linkedin`

## 🔒 Security Considerations

### Client Secrets (For Cloud Functions)

Each LinkedIn app will have a **Client Secret** that needs to be configured in Firebase Cloud Functions:

```bash
# Development
firebase use linkedgoals-dev
firebase functions:secrets:set LINKEDIN_CLIENT_SECRET
firebase functions:secrets:set LINKEDIN_CLIENT_ID

# Staging
firebase use linkedgoals-staging
firebase functions:secrets:set LINKEDIN_CLIENT_SECRET
firebase functions:secrets:set LINKEDIN_CLIENT_ID

# Production (already configured)
firebase use linkedgoals-d7053
# Already has LINKEDIN_CLIENT_SECRET and LINKEDIN_CLIENT_ID
```

### Environment Variables Summary

**Development**:
```bash
LINKEDIN_CLIENT_ID=your_dev_client_id
LINKEDIN_CLIENT_SECRET=your_dev_client_secret
LINKEDIN_REDIRECT_URI=https://linkedgoals-dev.web.app/linkedin
```

**Staging**:
```bash
LINKEDIN_CLIENT_ID=your_staging_client_id
LINKEDIN_CLIENT_SECRET=your_staging_client_secret
LINKEDIN_REDIRECT_URI=https://linkedgoals-staging.web.app/linkedin
```

**Production**:
```bash
LINKEDIN_CLIENT_ID=7880c93kzzfsgj
LINKEDIN_CLIENT_SECRET=existing_secret
LINKEDIN_REDIRECT_URI=https://app.linkedgoals.app/linkedin
```

## 🧪 Testing OAuth Flow

### Development Testing

1. **Local Development**:
   ```bash
   npm run dev
   # Navigate to http://localhost:5173
   # Click "Sign in with LinkedIn"
   # Should redirect to localhost:5173/linkedin
   ```

2. **Deployed Development**:
   ```bash
   npm run deploy:dev
   # Navigate to https://linkedgoals-dev.web.app
   # Test LinkedIn OAuth flow
   ```

### Staging Testing

```bash
npm run deploy:staging
# Navigate to https://linkedgoals-staging.web.app  
# Test complete OAuth flow with production-like data
```

### Production Testing (Already Working) ✅

Production OAuth is already configured and working at:
- `https://app.linkedgoals.app`

## 🔧 Troubleshooting

### Common Issues

1. **"invalid_client" Error**:
   - Verify client ID matches the environment
   - Check redirect URI is exactly correct (no trailing slashes)
   - Ensure the LinkedIn app has required products enabled

2. **"redirect_uri_mismatch" Error**:
   - Verify redirect URI in LinkedIn app settings
   - Check environment variables are loading correctly
   - Ensure no typos in URLs

3. **"access_denied" Error**:
   - Check OAuth scopes are correct (`profile`, `email`)
   - Verify LinkedIn app products are enabled
   - Test with a different LinkedIn account

### Debugging Steps

1. **Check Environment Variables**:
   ```bash
   # In browser console
   console.log(import.meta.env.VITE_LINKEDIN_CLIENT_ID);
   console.log(import.meta.env.VITE_LINKEDIN_REDIRECT_URI);
   ```

2. **Verify LinkedIn App Settings**:
   - Check redirect URIs in LinkedIn Developer Portal
   - Verify products are enabled and approved
   - Check OAuth scopes

3. **Monitor Cloud Function Logs**:
   ```bash
   firebase functions:log --project=linkedgoals-dev
   firebase functions:log --project=linkedgoals-staging
   ```

## 📋 Checklist

### Development Environment
- [ ] LinkedIn app created: "LinkedGoals Development"
- [ ] Redirect URIs configured:
  - [ ] `https://linkedgoals-dev.web.app/linkedin`
  - [ ] `http://localhost:5173/linkedin`
- [ ] Products enabled: "Sign In with LinkedIn using OpenID Connect"
- [ ] Client ID updated in `src/config/firebase-dev.ts`
- [ ] Client ID updated in `.env.development`
- [ ] Client Secret configured in Firebase Functions
- [ ] OAuth flow tested locally
- [ ] OAuth flow tested on deployed dev environment

### Staging Environment  
- [ ] LinkedIn app created: "LinkedGoals Staging"
- [ ] Redirect URI configured: `https://linkedgoals-staging.web.app/linkedin`
- [ ] Products enabled: "Sign In with LinkedIn using OpenID Connect"
- [ ] Client ID updated in `src/config/firebase-staging.ts`
- [ ] Client ID updated in `.env.staging`
- [ ] Client Secret configured in Firebase Functions
- [ ] OAuth flow tested on staging environment

### Production Environment ✅
- [x] LinkedIn app configured: "LinkedGoals"
- [x] Redirect URI: `https://app.linkedgoals.app/linkedin`
- [x] Client ID: `7880c93kzzfsgj`
- [x] OAuth flow working in production

## 🎯 Quick Start Command

After creating the LinkedIn apps, run this command to test all environments:

```bash
# Test development
./scripts/deploy-environment.sh dev
open https://linkedgoals-dev.web.app

# Test staging  
./scripts/deploy-environment.sh staging
open https://linkedgoals-staging.web.app

# Production already working
open https://app.linkedgoals.app
```

## 📞 Support

If you encounter issues:
1. Check the [LinkedIn Developer Documentation](https://docs.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow)
2. Review Firebase Cloud Functions logs
3. Verify all environment variables are set correctly
4. Test OAuth flow step by step

---

**Note**: The current setup uses the production LinkedIn client ID (`7880c93kzzfsgj`) for all environments temporarily. For better security and testing isolation, create separate LinkedIn apps for development and staging as outlined above.