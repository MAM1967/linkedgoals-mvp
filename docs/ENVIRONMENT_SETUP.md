# Environment Setup Guide

## Overview

LinkedGoals MVP has three environments set up with Firebase:

1. **Development**: `linkedgoals-development` → `https://linkedgoals-development.web.app`
2. **Staging**: `linkedgoals-staging` → `https://linkedgoals-staging.web.app`
3. **Production**: `linkedgoals-d7053` → `https://app.linkedgoals.app`

Each environment automatically detects its URL and configures LinkedIn OAuth accordingly.

## Environment URLs

### Development

- **Frontend**: `https://linkedgoals-development.web.app`
- **Functions**: `https://us-central1-linkedgoals-development.cloudfunctions.net`
- **LinkedIn Redirect**: `https://linkedgoals-development.web.app/linkedin`

### Staging

- **Frontend**: `https://linkedgoals-staging.web.app`
- **Functions**: `https://us-central1-linkedgoals-staging.cloudfunctions.net`
- **LinkedIn Redirect**: `https://linkedgoals-staging.web.app/linkedin`

### Production

- **Frontend**: `https://app.linkedgoals.app` (custom domain)
- **Fallback**: `https://linkedgoals-d7053.web.app`
- **Functions**: `https://us-central1-linkedgoals-d7053.cloudfunctions.net`
- **LinkedIn Redirect**: `https://app.linkedgoals.app/linkedin`

### Local Development

- **Frontend**: `http://localhost:5173`
- **Functions**: `http://localhost:5001` (emulator)
- **LinkedIn Redirect**: `http://localhost:5173/linkedin`

## Deployment Commands

### Development Environment

```bash
# Switch to development project
firebase use linkedgoals-development

# Deploy to development
npm run build
firebase deploy

# Deploy only functions
firebase deploy --only functions

# Deploy only hosting
firebase deploy --only hosting
```

### Staging Environment

```bash
# Switch to staging project
firebase use linkedgoals-staging

# Deploy to staging
npm run build
firebase deploy

# Test staging deployment
curl -I https://linkedgoals-staging.web.app
```

### Production Environment

```bash
# Switch to production project
firebase use linkedgoals-d7053

# Deploy to production
npm run build
firebase deploy

# Verify production deployment
curl -I https://app.linkedgoals.app
```

## LinkedIn OAuth Configuration

### LinkedIn Developer App Settings

You need to configure your LinkedIn Developer App with all environment redirect URIs:

**Authorized Redirect URLs** (add all of these):

```
http://localhost:5173/linkedin
https://linkedgoals-development.web.app/linkedin
https://linkedgoals-staging.web.app/linkedin
https://linkedgoals-d7053.web.app/linkedin
https://app.linkedgoals.app/linkedin
```

### Environment-Specific Secrets

Each Firebase project needs LinkedIn secrets configured:

#### Development

```bash
firebase use linkedgoals-development
firebase functions:secrets:set LINKEDIN_CLIENT_SECRET
firebase functions:secrets:set LINKEDIN_CLIENT_ID="7880c93kzzfsgj"
```

#### Staging

```bash
firebase use linkedgoals-staging
firebase functions:secrets:set LINKEDIN_CLIENT_SECRET
firebase functions:secrets:set LINKEDIN_CLIENT_ID="7880c93kzzfsgj"
```

#### Production

```bash
firebase use linkedgoals-d7053
firebase functions:secrets:set LINKEDIN_CLIENT_SECRET
firebase functions:secrets:set LINKEDIN_CLIENT_ID="7880c93kzzfsgj"
```

## Automatic Environment Detection

The application automatically detects which environment it's running in:

```typescript
// Frontend automatically detects and uses correct URLs
const getRedirectUri = () => {
  const hostname = window.location.hostname;

  if (hostname.includes("linkedgoals-development")) {
    return `https://${hostname}/linkedin`;
  } else if (hostname.includes("linkedgoals-staging")) {
    return `https://${hostname}/linkedin`;
  } else if (hostname === "app.linkedgoals.app") {
    return "https://app.linkedgoals.app/linkedin";
  } else if (hostname === "localhost") {
    return "http://localhost:5173/linkedin";
  } else {
    return `https://${hostname}/linkedin`;
  }
};
```

## Testing Each Environment

### Development Testing

```bash
# Deploy to development
firebase use linkedgoals-development
firebase deploy

# Test LinkedIn OAuth
# Visit: https://linkedgoals-development.web.app
# Click "Sign in with LinkedIn"
# Should redirect to LinkedIn and back to development URL
```

### Staging Testing

```bash
# Deploy to staging
firebase use linkedgoals-staging
firebase deploy

# Test full user flow
# Visit: https://linkedgoals-staging.web.app
# Test all features before promoting to production
```

### Production Testing

```bash
# Deploy to production
firebase use linkedgoals-d7053
firebase deploy

# Test live site
# Visit: https://app.linkedgoals.app
# Verify custom domain and LinkedIn OAuth work
```

## Environment Variables

### No Manual Configuration Needed

The new setup eliminates the need for environment-specific `.env` files:

- ✅ **LinkedIn Client ID**: Same across all environments
- ✅ **Redirect URIs**: Automatically detected
- ✅ **Function URLs**: Automatically detected
- ✅ **Firebase Project**: Determined by `firebase use`

### Local Development Only

Create `.env` for local development:

```bash
VITE_LINKEDIN_CLIENT_ID=7880c93kzzfsgj
# No need for VITE_LINKEDIN_REDIRECT_URI - auto-detected
```

## GitHub Actions CI/CD

Update your GitHub workflows to deploy to different environments:

### Development (on push to `develop` branch)

```yaml
name: Deploy to Development
on:
  push:
    branches: [develop]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci && npm run build
      - name: Deploy to Development
        run: |
          firebase use linkedgoals-development
          firebase deploy --token ${{ secrets.FIREBASE_TOKEN }}
```

### Staging (on push to `staging` branch)

```yaml
name: Deploy to Staging
on:
  push:
    branches: [staging]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci && npm run build
      - name: Deploy to Staging
        run: |
          firebase use linkedgoals-staging
          firebase deploy --token ${{ secrets.FIREBASE_TOKEN }}
```

### Production (on push to `main` branch)

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci && npm run build
      - name: Deploy to Production
        run: |
          firebase use linkedgoals-d7053
          firebase deploy --token ${{ secrets.FIREBASE_TOKEN }}
```

## Troubleshooting

### LinkedIn OAuth Issues

1. **"Redirect URI mismatch"**:

   - Ensure all environment URLs are added to LinkedIn app
   - Check exact URL format (include `/linkedin` path)

2. **Function not found**:

   - Verify correct project is selected: `firebase use <project-id>`
   - Check function deployment: `firebase functions:log`

3. **Environment detection issues**:
   - Check hostname in browser console
   - Verify URL patterns match the detection logic

### Deployment Issues

1. **Wrong environment deployed**:

   ```bash
   # Check current project
   firebase projects:list

   # Switch to correct project
   firebase use <correct-project-id>
   ```

2. **Functions not updating**:

   ```bash
   # Force function redeployment
   firebase deploy --only functions --force
   ```

3. **Secrets not available**:

   ```bash
   # List secrets for current project
   firebase functions:secrets:list

   # Set missing secrets
   firebase functions:secrets:set LINKEDIN_CLIENT_SECRET
   ```

## Benefits of This Setup

✅ **No manual environment configuration** - automatically detects environment
✅ **Single codebase** - same code works in all environments  
✅ **No hardcoded URLs** - dynamically determines correct endpoints
✅ **Easy testing** - deploy to any environment with one command
✅ **LinkedIn OAuth works everywhere** - all URLs configured in LinkedIn app
✅ **No localhost conflicts** - OAuth routes to proper environment URLs

This setup eliminates the need to manually configure environment variables and ensures LinkedIn OAuth works correctly in all environments without routing through localhost.
