# Deployment & DevOps

This document provides a comprehensive guide to deploying and managing the LinkedGoals MVP application across different environments.

## Table of Contents

- [Overview](#overview)
- [Build Process](#build-process)
- [Deployment Pipeline](#deployment-pipeline)
- [Environment Management](#environment-management)
- [Production Deployment](#production-deployment)
- [Preview Deployments](#preview-deployments)
- [Manual Deployment](#manual-deployment)
- [Monitoring & Logging](#monitoring--logging)
- [Rollback Procedures](#rollback-procedures)
- [Security Considerations](#security-considerations)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

## Overview

The application uses Firebase Hosting for frontend deployment and Firebase Cloud Functions for backend API deployment. The deployment process is automated through GitHub Actions with support for:

- **Production deployments** on pushes to `main` branch
- **Preview deployments** for pull requests
- **Manual deployments** via Firebase CLI
- **Multi-environment configuration** (development, staging, production)

### Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Firebase Cloud Functions (Node.js 20)
- **Hosting**: Firebase Hosting with CDN
- **Database**: Cloud Firestore
- **Authentication**: Firebase Auth + LinkedIn OAuth
- **CI/CD**: GitHub Actions
- **Monitoring**: Firebase Console + Google Cloud Monitoring

## Build Process

### Build Scripts

The application uses npm scripts defined in `package.json`:

```bash
# Development build
npm run dev              # Start Vite dev server on localhost:5173

# Production build
npm run build           # TypeScript compilation + Vite build
npm run preview         # Preview production build locally

# Testing
npm run test            # Run Jest unit tests
npm run test:watch      # Watch mode for development
npm run test:coverage   # Generate coverage report
npm run test:integration # Run integration tests with Firebase emulators
npm run test:e2e        # Run Cypress end-to-end tests
npm run test:all        # Run all test suites

# Firebase utilities
npm run firebase:emulators # Start Firebase emulators for local development

# Security & Analysis
npm run audit:security  # Run npm audit + Snyk security scan
npm run analyze:bundle  # Analyze bundle size with webpack-bundle-analyzer
```

### Build Process Details

1. **TypeScript Compilation**: `tsc -b` compiles TypeScript to JavaScript
2. **Vite Build**: Creates optimized production bundle in `dist/` directory
3. **Asset Optimization**:
   - Code splitting for optimal loading
   - CSS extraction and minification
   - Asset hashing for cache busting
   - Tree shaking for unused code elimination

### Build Artifacts

The build process generates:

- `dist/` - Frontend build artifacts for Firebase Hosting
- `functions/lib/` - Compiled Cloud Functions (TypeScript → JavaScript)
- `coverage/` - Test coverage reports
- `lighthouse-report.html` - Performance audit results

## Deployment Pipeline

### Automated CI/CD with GitHub Actions

#### Production Deployment (`firebase-hosting-merge.yml`)

Triggers on pushes to `main` branch:

```yaml
name: Deploy to Firebase Hosting on merge
on:
  push:
    branches: [main]

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - name: Install dependencies and build
        run: npm ci && npm run build
      - name: Install Firebase CLI
        run: npm install -g firebase-tools
      - name: Deploy to Firebase Hosting
        run: firebase deploy --only hosting --token ${{ secrets.FIREBASE_TOKEN }}
        env:
          FIREBASE_CLI_EXPERIMENTS: webframeworks
```

#### Preview Deployment (`firebase-hosting-pull-request.yml`)

Triggers on pull requests:

```yaml
name: Deploy to Firebase Hosting on PR
on: pull_request

jobs:
  build_and_preview:
    if: ${{ github.event.pull_request.head.repo.full_name == github.repository }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci && npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_LINKEDGOALS_D7053 }}
          projectId: linkedgoals-d7053
```

### Pipeline Stages

1. **Checkout**: Clone repository code
2. **Setup**: Install Node.js 20 with npm caching
3. **Dependencies**: `npm ci` for reproducible builds
4. **Build**: Execute build process (`npm run build`)
5. **Install Firebase CLI**: Global installation of firebase-tools
6. **Deploy**: Deploy to Firebase Hosting using token authentication

### GitHub Secrets Configuration

The CI/CD pipeline requires the following GitHub repository secrets:

#### Required Secrets

- **`FIREBASE_TOKEN`**: Firebase CI token for authentication
  - Generate using: `firebase login:ci`
  - Used for: Automated deployments via Firebase CLI
  - Scope: Deploy to Firebase Hosting only

#### Setting Up Secrets

1. **Generate Firebase Token**:

   ```bash
   firebase login:ci
   # Copy the generated token
   ```

2. **Add to GitHub Repository**:
   - Go to repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `FIREBASE_TOKEN`
   - Value: Paste the token from step 1
   - Click "Add secret"

#### Security Considerations

- Token provides deployment access only (no read access to Firebase data)
- Token scope is limited to hosting deployments
- Tokens can be revoked and regenerated if compromised
- More secure than service account JSON files

## Environment Management

### Environment Configuration Files

#### `firebase.json`

Main Firebase configuration:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }],
    "headers": [
      {
        "source": "**/*.@(js|css|svg|jpg|jpeg|png|gif|ico|json)",
        "headers": [{ "key": "Cache-Control", "value": "max-age=31536000" }]
      },
      {
        "source": "**",
        "headers": [
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "X-Frame-Options", "value": "DENY" },
          { "key": "X-XSS-Protection", "value": "1; mode=block" }
        ]
      }
    ]
  },
  "functions": [
    {
      "source": "functions",
      "runtime": "nodejs20"
    }
  ],
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

#### `apphosting.yaml`

Production app hosting configuration:

```yaml
runConfig:
  minInstances: 0 # Auto-scale to zero when not in use
  # maxInstances: 100    # Maximum concurrent instances
  # concurrency: 80      # Requests per instance
# env:                   # Environment variables and secrets
# - variable: API_KEY
#   secret: api-key-secret
```

#### `apphosting.emulator.yaml`

Local development configuration:

```yaml
env:
  # Local environment variables for emulator
  # - variable: DEBUG_MODE
  #   value: "true"
```

### Environment Variables

#### Frontend Environment Variables

Managed through Vite's environment system:

```typescript
// Environment variables available in frontend
const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  firebaseConfig: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    // ... other Firebase config
  },
  linkedinClientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID,
  environment: import.meta.env.NODE_ENV,
};
```

#### Backend Environment Variables

Managed through Firebase Functions configuration:

```bash
# Set environment variables for Cloud Functions
firebase functions:config:set linkedin.client_id="your_client_id"
firebase functions:config:set linkedin.client_secret="your_client_secret"
firebase functions:config:set app.environment="production"
```

### Environment-Specific Configurations

#### Development

- Firebase Emulators for local services
- Hot module replacement via Vite
- Debug logging enabled
- CORS allowing localhost origins

#### Staging/Preview

- Preview channels for each PR
- Production-like environment
- Limited external integrations
- Performance monitoring enabled

#### Production

- Live Firebase project
- CDN caching optimized
- Security headers enforced
- Full monitoring and alerting

## Production Deployment

### Prerequisites

1. **Firebase CLI**: Install and authenticate

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use linkedgoals-d7053
   ```

2. **GitHub Secrets**: Ensure required secrets are configured:

   - `FIREBASE_SERVICE_ACCOUNT_LINKEDGOALS_D7053`
   - `GITHUB_TOKEN` (automatically provided)

3. **Environment Variables**: Configure production environment variables in Firebase Console

### Deployment Process

#### Automatic Deployment

Production deployment happens automatically when code is merged to `main`:

1. **Trigger**: Push to `main` branch
2. **Build**: GitHub Actions runs build process
3. **Deploy**: Artifacts deployed to Firebase Hosting
4. **Verify**: Check deployment status in Firebase Console

#### Manual Verification Steps

After deployment, verify:

1. **Application Health**:

   ```bash
   # Check if site is accessible
   curl -I https://linkedgoals-d7053.web.app

   # Verify specific endpoints
   curl https://linkedgoals-d7053.web.app/api/health
   ```

2. **Authentication Flow**:

   - Test LinkedIn OAuth integration
   - Verify Firebase Auth tokens
   - Check user session persistence

3. **Database Connectivity**:

   - Test Firestore read/write operations
   - Verify security rules enforcement
   - Check index performance

4. **Performance Metrics**:
   - Run Lighthouse audit: `npm run test:performance`
   - Check Core Web Vitals in Firebase Console
   - Monitor initial load times

### Deployment Checklist

- [ ] All tests passing (`npm run test:all`)
- [ ] Security audit clean (`npm run audit:security`)
- [ ] Bundle size within limits (`npm run analyze:bundle`)
- [ ] Environment variables configured
- [ ] Firestore security rules updated
- [ ] Cloud Functions deployed and healthy
- [ ] LinkedIn OAuth redirect URIs updated
- [ ] Performance benchmarks met
- [ ] Monitoring alerts configured

## Preview Deployments

### Pull Request Previews

Every pull request automatically gets a preview deployment:

1. **Creation**: Preview created when PR is opened
2. **Updates**: Preview updated on new commits
3. **Access**: Preview URL commented on PR
4. **Cleanup**: Preview deleted when PR is closed/merged

### Preview URLs

- Format: `https://linkedgoals-d7053--pr-[PR_NUMBER]-[HASH].web.app`
- Accessible to team members with Firebase project access
- Full functionality including database and authentication

### Testing Previews

1. **Functional Testing**:

   - Test new features in isolation
   - Verify existing functionality unchanged
   - Cross-browser compatibility checks

2. **Integration Testing**:

   - LinkedIn OAuth with development app
   - Firebase services connectivity
   - Third-party API integrations

3. **Performance Testing**:
   - Lighthouse audit on preview URL
   - Bundle size comparison
   - Load time measurements

## Manual Deployment

### Local Deployment to Staging

For testing before main branch merge:

```bash
# 1. Build application
npm run build

# 2. Deploy to preview channel
firebase hosting:channel:deploy staging
# Returns: https://linkedgoals-d7053--staging-[HASH].web.app

# 3. Test staging deployment
npm run test:e2e -- --baseUrl="https://linkedgoals-d7053--staging-[HASH].web.app"

# 4. Promote to live (if needed)
firebase hosting:channel:deploy live
```

### Emergency Production Deployment

For critical hotfixes:

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix

# 2. Make minimal changes
# ... apply fixes ...

# 3. Test locally
npm run test:all
npm run build
firebase emulators:start --only hosting,functions

# 4. Deploy directly (bypass normal workflow)
firebase deploy --only hosting,functions

# 5. Create PR and merge after verification
git push origin hotfix/critical-fix
# Create PR via GitHub UI
```

### Cloud Functions Deployment

Deploy backend functions separately:

```bash
# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:linkedinLogin

# Deploy with environment config
firebase functions:config:set service.key="value"
firebase deploy --only functions
```

## Monitoring & Logging

### Firebase Console Monitoring

#### Hosting Metrics

- **Performance**: Page load times, Core Web Vitals
- **Usage**: Page views, unique users, bandwidth
- **Errors**: 4xx/5xx response codes, failed requests

#### Cloud Functions Metrics

- **Invocations**: Request count, success rate
- **Performance**: Execution time, memory usage
- **Errors**: Function errors, timeout rate
- **Costs**: Compute time, network egress

#### Firestore Metrics

- **Operations**: Read/write counts, index usage
- **Performance**: Query execution time
- **Storage**: Document count, storage size
- **Security**: Rule evaluation, denied requests

### Google Cloud Monitoring

#### Custom Metrics

```javascript
// Frontend performance tracking
import { getPerformance } from "firebase/performance";

const perf = getPerformance();
const trace = trace(perf, "goal_creation_flow");
trace.start();
// ... user action ...
trace.stop();
```

#### Alerting Policies

- **Error Rate**: Alert if error rate > 5% for 5 minutes
- **Response Time**: Alert if 95th percentile > 3 seconds
- **Availability**: Alert if uptime < 99.5%
- **Budget**: Alert when costs exceed monthly budget

### Log Aggregation

#### Frontend Logging

```typescript
// Structured logging for frontend
const logger = {
  info: (message: string, data?: any) => {
    console.log(
      JSON.stringify({
        level: "info",
        message,
        data,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      })
    );
  },
  error: (message: string, error?: Error) => {
    console.error(
      JSON.stringify({
        level: "error",
        message,
        error: error?.message,
        stack: error?.stack,
        timestamp: new Date().toISOString(),
      })
    );
  },
};
```

#### Backend Logging

```typescript
// Cloud Functions logging
import { logger } from "firebase-functions";

export const linkedinLogin = functions.https.onCall(async (data, context) => {
  logger.info("LinkedIn login initiated", {
    uid: context.auth?.uid,
    timestamp: new Date().toISOString(),
  });

  try {
    // ... function logic ...
    logger.info("LinkedIn login successful", { uid: context.auth?.uid });
  } catch (error) {
    logger.error("LinkedIn login failed", {
      uid: context.auth?.uid,
      error: error.message,
    });
    throw error;
  }
});
```

## Rollback Procedures

### Firebase Hosting Rollback

#### Automatic Rollback

Firebase Hosting maintains previous versions:

```bash
# List previous releases
firebase hosting:releases:list

# Rollback to previous version
firebase hosting:releases:rollback

# Rollback to specific version
firebase hosting:releases:rollback --version VERSION_ID
```

#### Manual Rollback Steps

1. **Identify Issue**:

   - Check Firebase Console for error spikes
   - Review user reports and monitoring alerts
   - Identify specific version causing issues

2. **Immediate Rollback**:

   ```bash
   # Quick rollback to last known good version
   firebase hosting:releases:rollback

   # Verify rollback successful
   curl -I https://linkedgoals-d7053.web.app
   ```

3. **Verification**:

   - Test core functionality
   - Check error rates return to normal
   - Verify user authentication working
   - Confirm database operations functional

4. **Communication**:
   - Notify team of rollback
   - Update incident status
   - Plan fix for rolled-back issue

### Cloud Functions Rollback

```bash
# List function versions
gcloud functions versions list --function=linkedinLogin

# Rollback to previous version
gcloud functions deploy linkedinLogin --source=previous-version/

# Or restore from backup
firebase functions:config:get > backup-config.json
firebase deploy --only functions
```

### Database Rollback

#### Firestore Backup Restoration

```bash
# List available backups
gcloud firestore operations list

# Restore from backup (creates new database)
gcloud firestore databases restore \
  --source-backup=projects/linkedgoals-d7053/locations/nam5/backups/BACKUP_ID \
  --destination-database=restored-db

# Migrate users to restored database (if needed)
```

#### Partial Data Rollback

```typescript
// Script to rollback specific collections
import { adminDb } from "./admin-config";

async function rollbackUserGoals(fromDate: Date) {
  const batch = adminDb.batch();

  const snapshot = await adminDb
    .collection("goals")
    .where("createdAt", ">=", fromDate)
    .get();

  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`Rolled back ${snapshot.size} goals created after ${fromDate}`);
}
```

### Rollback Decision Matrix

| Issue Severity                | Response Time | Rollback Threshold          |
| ----------------------------- | ------------- | --------------------------- |
| Critical (Site Down)          | < 5 minutes   | Immediate                   |
| High (Core Feature Broken)    | < 15 minutes  | If no quick fix             |
| Medium (Performance Degraded) | < 30 minutes  | If > 50% users affected     |
| Low (Minor Bug)               | < 2 hours     | If affects key user journey |

## Security Considerations

### Deployment Security

#### Access Control

- **GitHub Repository**: Limited to team members with 2FA
- **Firebase Project**: Role-based access with principle of least privilege
- **Service Accounts**: Scoped to specific deployment actions
- **Environment Variables**: Stored in GitHub Secrets, not in code

#### Security Headers

Enforced via `firebase.json`:

```json
{
  "headers": [
    {
      "source": "**",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline'"
        }
      ]
    }
  ]
}
```

#### Secrets Management

- **API Keys**: Stored in Firebase configuration, not in code
- **Service Account Keys**: GitHub repository secrets
- **LinkedIn OAuth**: Environment-specific client IDs/secrets
- **Database Keys**: Firebase Admin SDK with service account

### Runtime Security

#### Authentication

- **Firebase Auth**: Secure token validation
- **LinkedIn OAuth**: PKCE flow for enhanced security
- **Session Management**: Automatic token refresh
- **Route Protection**: Client-side and server-side guards

#### Database Security

- **Firestore Rules**: User-based access control
- **Data Validation**: Schema validation on write operations
- **Audit Logging**: All database operations logged
- **Backup Encryption**: Automatic encryption at rest

## Performance Optimization

### Build Optimization

#### Bundle Optimization

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          firebase: ["firebase/app", "firebase/auth", "firebase/firestore"],
          charts: ["chart.js", "react-chartjs-2"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
```

#### Asset Optimization

- **Images**: WebP format with fallbacks
- **Fonts**: Preload critical fonts
- **CSS**: Critical CSS inlined, non-critical deferred
- **JavaScript**: Tree shaking and code splitting

### Runtime Performance

#### Caching Strategy

```json
// firebase.json caching headers
{
  "source": "**/*.@(js|css|svg|jpg|jpeg|png|gif|ico|json)",
  "headers": [{ "key": "Cache-Control", "value": "max-age=31536000" }]
}
```

#### Service Worker

```typescript
// sw.js - Cache-first strategy for static assets
self.addEventListener("fetch", (event) => {
  if (event.request.destination === "image") {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
```

### Database Performance

#### Query Optimization

- **Composite Indexes**: Created for common query patterns
- **Pagination**: Cursor-based pagination for large result sets
- **Batch Operations**: Group multiple operations
- **Connection Pooling**: Reuse database connections

#### Cloud Functions Performance

```typescript
// functions/src/index.ts
import { onCall } from "firebase-functions/v2/https";

export const optimizedFunction = onCall(
  {
    memory: "256MiB", // Right-size memory allocation
    timeoutSeconds: 30, // Appropriate timeout
    minInstances: 0, // Scale to zero when not in use
    maxInstances: 100, // Prevent runaway scaling
    concurrency: 80, // Handle multiple requests per instance
  },
  async (request) => {
    // Function logic with performance monitoring
  }
);
```

### Performance Benchmarks

#### Target Metrics

- **First Contentful Paint**: < 1.5 seconds
- **Largest Contentful Paint**: < 2.5 seconds
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms
- **Time to Interactive**: < 3.5 seconds

#### Monitoring

```bash
# Regular performance audits
npm run test:performance

# Bundle size analysis
npm run analyze:bundle

# Core Web Vitals tracking
# Automatically tracked in Firebase Performance Monitoring
```

## Troubleshooting

### CI/CD Pipeline Issues

#### GitHub Actions Workflow Failures

**Symptom**: Deployment fails with authentication errors

```
Error: HTTP Error: 401, Request had invalid authentication credentials.
```

**Solution**:

1. Verify `FIREBASE_TOKEN` secret is set correctly
2. Generate a new token: `firebase login:ci`
3. Update the GitHub secret with the new token

**Symptom**: Build fails with "firebase command not found"

```
/bin/bash: firebase: command not found
```

**Solution**: Workflow includes Firebase CLI installation step:

```yaml
- name: Install Firebase CLI
  run: npm install -g firebase-tools
```

**Symptom**: Deployment targets wrong Firebase project

```
Error: Invalid project id: undefined
```

**Solution**: Ensure `firebase use linkedgoals-d7053` was run and `.firebaserc` is committed

#### Token Authentication vs Service Account

**Current Setup (Working)**:

- Uses `FIREBASE_TOKEN` secret with `firebase deploy --token` command
- More reliable and easier to set up
- Token-based authentication for CI environments

**Previous Setup (Deprecated)**:

- Used `FirebaseExtended/action-hosting-deploy@v0` action
- Required `FIREBASE_SERVICE_ACCOUNT_*` secrets
- More complex setup with service account JSON

#### Deployment Verification

After successful GitHub Actions deployment:

1. **Check Live Site**: https://linkedgoals-d7053.web.app
2. **Verify Build Assets**: Check for updated timestamps in Network tab
3. **Monitor Logs**: Firebase Console → Functions → Logs
4. **Test Critical Paths**: Login, goal creation, progress updates

### Common Deployment Issues

#### Build Failures

```bash
# Clear cache and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check TypeScript compilation
npm run build

# Verify all imports are correct
npm run lint
```

#### Deployment Timeouts

```bash
# Check Firebase CLI version
firebase --version

# Re-authenticate if needed
firebase logout
firebase login

# Deploy with debug logging
firebase deploy --debug
```

#### Environment Variable Issues

```bash
# List current config
firebase functions:config:get

# Update configuration
firebase functions:config:set app.environment="production"

# Verify config in deployed function
firebase functions:log --only linkedinLogin
```

### GitHub Actions Debugging

#### Failed Builds

1. **Check Node.js Version**: Ensure GitHub Actions uses Node.js 20
2. **Cache Issues**: Clear npm cache in workflow
3. **Dependencies**: Verify package-lock.json is committed
4. **Secrets**: Ensure `FIREBASE_TOKEN` secret is properly configured

#### Authentication Issues

**Current Token-Based Method**:

```yaml
- name: Deploy to Firebase Hosting
  run: firebase deploy --only hosting --token ${{ secrets.FIREBASE_TOKEN }}
```

**Common Issues**:

- Expired token: Regenerate with `firebase login:ci`
- Missing secret: Ensure `FIREBASE_TOKEN` is set in GitHub repository secrets
- Wrong project: Verify `.firebaserc` file contains correct project ID

#### Build Performance

Current optimized workflow completes in ~50-60 seconds:

- Checkout: ~5s
- Node.js setup with cache: ~10s
- Dependencies: ~15s
- Build: ~20s
- Deploy: ~10s

### Firebase Hosting Issues

#### 404 Errors

- **Rewrites**: Verify SPA rewrite rules in `firebase.json`
- **Build Output**: Confirm `dist/` directory contains `index.html`
- **Cache**: Clear CDN cache after deployment

#### Performance Issues

- **Headers**: Check caching headers are properly set
- **Compression**: Verify gzip compression is enabled
- **Bundle Size**: Use bundle analyzer to identify large dependencies

### Database Connectivity

#### Firestore Connection Issues

```typescript
// Test Firestore connectivity
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase-config";

async function testConnection() {
  try {
    const docRef = doc(db, "test", "connection");
    const docSnap = await getDoc(docRef);
    console.log("Firestore connected:", docSnap.exists());
  } catch (error) {
    console.error("Firestore connection failed:", error);
  }
}
```

#### Security Rules Issues

```bash
# Test security rules
firebase firestore:rules:test --test-suite=firestore-test-suite.json

# Deploy updated rules
firebase deploy --only firestore:rules
```

### Emergency Response

#### Site Down Procedure

1. **Check Status**: Firebase Console → Hosting → Usage
2. **Verify DNS**: `nslookup linkedgoals-d7053.web.app`
3. **Rollback**: `firebase hosting:releases:rollback`
4. **Monitor**: Watch error rates and user reports
5. **Communicate**: Update status page and notify stakeholders

#### Performance Degradation

1. **Identify Source**: Check Firebase Performance Monitoring
2. **Database Load**: Monitor Firestore metrics for query performance
3. **Function Errors**: Check Cloud Functions logs for exceptions
4. **CDN Issues**: Verify caching headers and edge locations
5. **Scale Resources**: Increase Cloud Functions memory/instances if needed

#### Security Incidents

1. **Isolate**: Disable affected functions or features
2. **Investigate**: Review access logs and authentication events
3. **Patch**: Apply security fixes and redeploy
4. **Audit**: Review all access permissions and API keys
5. **Report**: Document incident and lessons learned

---

For additional support, refer to:

- [Firebase Documentation](https://firebase.google.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite Documentation](https://vitejs.dev/guide/)
- [Project Issue Tracker](https://github.com/your-org/linkedgoals-mvp/issues)
