# Firebase Multi-Environment Setup Guide

## Overview

This guide provides step-by-step instructions for setting up Firebase development, staging, and production environments for the LinkedGoals MVP project.

## Current Setup

- **Production**: `linkedgoals-d7053` (existing)
- **Staging**: `linkedgoals-staging` (to be created)
- **Development**: `linkedgoals-dev` (to be created)

## Prerequisites

1. Firebase CLI installed globally
2. Google Cloud Console access
3. GitHub repository admin access
4. Node.js 18+ installed

## Step 1: Create Firebase Projects

### 1.1 Create Development Environment

```bash
# Create new Firebase project
firebase projects:create linkedgoals-dev --display-name "LinkedGoals Development"

# Enable required services
firebase use linkedgoals-dev
firebase services:enable firestore.googleapis.com
firebase services:enable functions.googleapis.com
firebase services:enable storage.googleapis.com
```

### 1.2 Create Staging Environment

```bash
# Create new Firebase project
firebase projects:create linkedgoals-staging --display-name "LinkedGoals Staging"

# Enable required services
firebase use linkedgoals-staging
firebase services:enable firestore.googleapis.com
firebase services:enable functions.googleapis.com
firebase services:enable storage.googleapis.com
```

### 1.3 Rename Production Environment (Optional)

For consistency, you may want to rename the production project:

```bash
# In Firebase Console, go to Project Settings > General
# Change project name to "LinkedGoals Production"
```

## Step 2: Configure Project Aliases

Update `.firebaserc` to include all environments:

```json
{
  "projects": {
    "default": "linkedgoals-d7053",
    "prod": "linkedgoals-d7053",
    "staging": "linkedgoals-staging",
    "dev": "linkedgoals-dev"
  },
  "targets": {},
  "etags": {
    "linkedgoals-d7053": {
      "extensionInstances": {}
    },
    "linkedgoals-staging": {
      "extensionInstances": {}
    },
    "linkedgoals-dev": {
      "extensionInstances": {}
    }
  }
}
```

## Step 3: Environment-Specific Configuration

### 3.1 Create Environment Configuration Files

Create `src/config/` directory with environment-specific Firebase configs:

#### `src/config/firebase-dev.ts`
```typescript
export const firebaseConfig = {
  apiKey: "YOUR_DEV_API_KEY",
  authDomain: "linkedgoals-dev.firebaseapp.com",
  databaseURL: "https://linkedgoals-dev-default-rtdb.firebaseio.com",
  projectId: "linkedgoals-dev",
  storageBucket: "linkedgoals-dev.firebasestorage.app",
  messagingSenderId: "YOUR_DEV_SENDER_ID",
  appId: "YOUR_DEV_APP_ID",
};

export const environment = {
  production: false,
  staging: false,
  development: true,
  enableEmulators: true,
  apiUrl: "https://us-central1-linkedgoals-dev.cloudfunctions.net",
  linkedinClientId: "YOUR_DEV_LINKEDIN_CLIENT_ID",
};
```

#### `src/config/firebase-staging.ts`
```typescript
export const firebaseConfig = {
  apiKey: "YOUR_STAGING_API_KEY",
  authDomain: "linkedgoals-staging.firebaseapp.com",
  databaseURL: "https://linkedgoals-staging-default-rtdb.firebaseio.com",
  projectId: "linkedgoals-staging",
  storageBucket: "linkedgoals-staging.firebasestorage.app",
  messagingSenderId: "YOUR_STAGING_SENDER_ID",
  appId: "YOUR_STAGING_APP_ID",
};

export const environment = {
  production: false,
  staging: true,
  development: false,
  enableEmulators: false,
  apiUrl: "https://us-central1-linkedgoals-staging.cloudfunctions.net",
  linkedinClientId: "YOUR_STAGING_LINKEDIN_CLIENT_ID",
};
```

#### `src/config/firebase-prod.ts`
```typescript
export const firebaseConfig = {
  apiKey: "AIzaSyD2q7PxQoZykMIih6-8fCeNhxBjPxVpBpc",
  authDomain: "linkedgoals-d7053.firebaseapp.com",
  databaseURL: "https://linkedgoals-d7053-default-rtdb.firebaseio.com",
  projectId: "linkedgoals-d7053",
  storageBucket: "linkedgoals-d7053.firebasestorage.app",
  messagingSenderId: "753801883214",
  appId: "1:753801883214:web:cf46567024a37452a65d1f",
};

export const environment = {
  production: true,
  staging: false,
  development: false,
  enableEmulators: false,
  apiUrl: "https://us-central1-linkedgoals-d7053.cloudfunctions.net",
  linkedinClientId: "YOUR_PROD_LINKEDIN_CLIENT_ID",
};
```

#### `src/config/index.ts`
```typescript
// Environment detection and configuration loader
const getEnvironment = (): string => {
  // Check for environment variable first
  if (import.meta.env.VITE_ENVIRONMENT) {
    return import.meta.env.VITE_ENVIRONMENT;
  }
  
  // Check hostname for automatic environment detection
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    if (hostname.includes('linkedgoals-dev') || hostname.includes('localhost')) {
      return 'development';
    }
    
    if (hostname.includes('linkedgoals-staging')) {
      return 'staging';
    }
    
    if (hostname.includes('linkedgoals-d7053')) {
      return 'production';
    }
  }
  
  // Default to development
  return 'development';
};

const environment = getEnvironment();

let config;
switch (environment) {
  case 'staging':
    config = await import('./firebase-staging');
    break;
  case 'production':
    config = await import('./firebase-prod');
    break;
  case 'development':
  default:
    config = await import('./firebase-dev');
    break;
}

export const firebaseConfig = config.firebaseConfig;
export const environmentConfig = config.environment;
export const currentEnvironment = environment;
```

### 3.2 Update Main Firebase Configuration

Update `src/lib/firebase.ts`:

```typescript
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { firebaseConfig, environmentConfig, currentEnvironment } from "../config";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

// Connect to emulators if enabled
if (environmentConfig.enableEmulators && typeof window !== "undefined") {
  try {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
    console.log(`🔧 Connected to Firebase emulators (${currentEnvironment})`);
  } catch (error) {
    console.log("⚠️ Emulators already connected or not available:", error);
  }
}

console.log(`🔥 Firebase initialized for ${currentEnvironment} environment`);

export { auth, db, functions };
export { currentEnvironment, environmentConfig };
```

## Step 4: Environment Variables

### 4.1 Create Environment Files

#### `.env.development`
```bash
VITE_ENVIRONMENT=development
VITE_FIREBASE_PROJECT_ID=linkedgoals-dev
VITE_LINKEDIN_CLIENT_ID=your_dev_linkedin_client_id
VITE_API_URL=https://us-central1-linkedgoals-dev.cloudfunctions.net
```

#### `.env.staging`
```bash
VITE_ENVIRONMENT=staging
VITE_FIREBASE_PROJECT_ID=linkedgoals-staging
VITE_LINKEDIN_CLIENT_ID=your_staging_linkedin_client_id
VITE_API_URL=https://us-central1-linkedgoals-staging.cloudfunctions.net
```

#### `.env.production`
```bash
VITE_ENVIRONMENT=production
VITE_FIREBASE_PROJECT_ID=linkedgoals-d7053
VITE_LINKEDIN_CLIENT_ID=your_prod_linkedin_client_id
VITE_API_URL=https://us-central1-linkedgoals-d7053.cloudfunctions.net
```

### 4.2 Update .gitignore

```bash
# Environment files
.env.local
.env.development.local
.env.staging.local
.env.production.local

# But keep the base environment files
!.env.development
!.env.staging
!.env.production
```

## Step 5: GitHub Actions CI/CD Pipeline

### 5.1 Development Environment Workflow

Create `.github/workflows/deploy-dev.yml`:

```yaml
name: Deploy to Development
on:
  push:
    branches: [develop]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: development
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm run test
        
      - name: Build for development
        run: npm run build
        env:
          VITE_ENVIRONMENT: development
          
      - name: Deploy to Firebase Dev
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_DEV }}
          projectId: linkedgoals-dev
          channelId: live
```

### 5.2 Staging Environment Workflow

Create `.github/workflows/deploy-staging.yml`:

```yaml
name: Deploy to Staging
on:
  push:
    branches: [staging]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run full test suite
        run: npm run test:all
        
      - name: Security audit
        run: npm audit --audit-level high
        
      - name: Build for staging
        run: npm run build
        env:
          VITE_ENVIRONMENT: staging
          
      - name: Deploy to Firebase Staging
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_STAGING }}
          projectId: linkedgoals-staging
          channelId: live
          
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          BASE_URL: https://linkedgoals-staging.web.app
```

### 5.3 Production Environment Workflow

Update `.github/workflows/firebase-hosting-merge.yml`:

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run full test suite
        run: npm run test:all
        
      - name: Security audit
        run: npm audit --audit-level high
        
      - name: Build for production
        run: npm run build
        env:
          VITE_ENVIRONMENT: production
          
      - name: Deploy to Firebase Production
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT_PROD }}
          projectId: linkedgoals-d7053
          channelId: live
          
      - name: Notify deployment
        run: echo "✅ Production deployment successful"
```

## Step 6: Firebase Security Rules

### 6.1 Environment-Specific Rules

Create separate rule files for each environment:

#### `firestore.rules.dev`
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Development rules - more permissive for testing
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Admin access for development
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### `firestore.rules.staging`
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Staging rules - production-like but with test data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && isAdmin();
    }
    
    match /users/{userId}/goals/{goalId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if request.auth != null && isAdmin();
    }
    
    function isAdmin() {
      return request.auth != null && 
             request.auth.uid in ['STAGING_ADMIN_UID_1', 'STAGING_ADMIN_UID_2'];
    }
  }
}
```

#### `firestore.rules.prod`
```javascript
// Use existing firestore.rules for production
```

## Step 7: GitHub Secrets Configuration

### 7.1 Required Secrets

Add these secrets to your GitHub repository:

#### Development Environment
- `FIREBASE_SERVICE_ACCOUNT_DEV`
- `FIREBASE_TOKEN_DEV`

#### Staging Environment
- `FIREBASE_SERVICE_ACCOUNT_STAGING`
- `FIREBASE_TOKEN_STAGING`

#### Production Environment
- `FIREBASE_SERVICE_ACCOUNT_PROD`
- `FIREBASE_TOKEN_PROD`

### 7.2 Generate Service Accounts

For each environment:

```bash
# Generate service account for each environment
firebase use linkedgoals-dev
firebase projects:addfirebase linkedgoals-dev
gcloud iam service-accounts create github-actions-dev \
  --display-name="GitHub Actions Dev" \
  --project=linkedgoals-dev

# Generate key
gcloud iam service-accounts keys create key-dev.json \
  --iam-account=github-actions-dev@linkedgoals-dev.iam.gserviceaccount.com

# Repeat for staging and production
```

## Step 8: Package.json Scripts

Update your `package.json` with environment-specific scripts:

```json
{
  "scripts": {
    "dev": "vite --mode development",
    "build": "tsc && vite build",
    "build:dev": "tsc && vite build --mode development",
    "build:staging": "tsc && vite build --mode staging",
    "build:prod": "tsc && vite build --mode production",
    
    "deploy:dev": "firebase deploy --only hosting,functions --project dev",
    "deploy:staging": "firebase deploy --only hosting,functions --project staging",
    "deploy:prod": "firebase deploy --only hosting,functions --project prod",
    
    "emulators:dev": "firebase emulators:start --project dev",
    "emulators:staging": "firebase emulators:start --project staging",
    
    "test:dev": "npm run test -- --testEnvironment=development",
    "test:staging": "npm run test -- --testEnvironment=staging",
    "test:prod": "npm run test -- --testEnvironment=production"
  }
}
```

## Step 9: Deployment Commands

### 9.1 Deploy to Development

```bash
# Deploy to development
npm run build:dev
firebase deploy --only hosting,functions --project dev

# Or use alias
firebase use dev
firebase deploy --only hosting,functions
```

### 9.2 Deploy to Staging

```bash
# Deploy to staging
npm run build:staging
firebase deploy --only hosting,functions --project staging

# Or use alias
firebase use staging
firebase deploy --only hosting,functions
```

### 9.3 Deploy to Production

```bash
# Deploy to production
npm run build:prod
firebase deploy --only hosting,functions --project prod

# Or use alias
firebase use prod
firebase deploy --only hosting,functions
```

## Step 10: Testing Strategy

### 10.1 Development Environment
- Use Firebase Emulators for local development
- Test new features in isolation
- Permissive security rules for easier testing

### 10.2 Staging Environment
- Production-like environment with test data
- Full integration testing
- E2E testing before production deployment

### 10.3 Production Environment
- Live environment with real user data
- Minimal testing (smoke tests only)
- Full monitoring and alerting

## Step 11: Monitoring Setup

### 11.1 Environment-Specific Monitoring

Configure monitoring for each environment:

```bash
# Development - Basic monitoring
firebase use dev
firebase deploy --only functions:monitoring

# Staging - Comprehensive monitoring
firebase use staging
firebase deploy --only functions:monitoring

# Production - Full monitoring + alerting
firebase use prod
firebase deploy --only functions:monitoring
```

## Step 12: LinkedIn OAuth Configuration

### 12.1 Create LinkedIn Apps

Create separate LinkedIn applications for each environment:

1. **Development**: `LinkedGoals Dev`
   - Redirect URI: `https://linkedgoals-dev.web.app/auth/callback`
   - Redirect URI: `http://localhost:5173/auth/callback`

2. **Staging**: `LinkedGoals Staging`
   - Redirect URI: `https://linkedgoals-staging.web.app/auth/callback`

3. **Production**: `LinkedGoals` (existing)
   - Redirect URI: `https://linkedgoals-d7053.web.app/auth/callback`

### 12.2 Update Environment Variables

Update each environment's `.env` file with the corresponding LinkedIn client ID.

## Step 13: Verification Checklist

After setup, verify each environment:

- [ ] Firebase projects created and configured
- [ ] Project aliases working (`firebase use dev/staging/prod`)
- [ ] Environment-specific configurations loading correctly
- [ ] GitHub Actions workflows deploying successfully
- [ ] LinkedIn OAuth working in each environment
- [ ] Firestore security rules appropriate for each environment
- [ ] Monitoring and logging configured
- [ ] Environment switching working correctly

## Step 14: Maintenance

### 14.1 Regular Tasks

- Monitor Firebase usage and costs for each environment
- Update security rules across all environments
- Keep environment configurations in sync
- Review and update GitHub Actions workflows
- Clean up test data in development and staging

### 14.2 Environment Synchronization

```bash
# Sync security rules across environments
firebase deploy --only firestore:rules --project dev
firebase deploy --only firestore:rules --project staging
firebase deploy --only firestore:rules --project prod

# Sync functions across environments
firebase deploy --only functions --project dev
firebase deploy --only functions --project staging
firebase deploy --only functions --project prod
```

## Troubleshooting

### Common Issues

1. **Environment detection not working**
   - Check `VITE_ENVIRONMENT` variable
   - Verify hostname-based detection logic

2. **Firebase config not loading**
   - Ensure environment config files exist
   - Check import paths in `src/config/index.ts`

3. **GitHub Actions failing**
   - Verify all required secrets are set
   - Check service account permissions

4. **Emulators not connecting**
   - Ensure Firebase emulators are running
   - Check port configurations

### Support

For issues with this setup, refer to:
- Firebase documentation
- GitHub Actions documentation
- LinkedIn Developer documentation
- Internal team documentation

## Conclusion

This multi-environment setup provides:
- Complete separation of development, staging, and production environments
- Automated CI/CD pipeline with proper testing
- Environment-specific configurations and security
- Scalable architecture for team collaboration
- Proper monitoring and observability

The setup follows Firebase best practices and provides a solid foundation for reliable application deployment and maintenance.