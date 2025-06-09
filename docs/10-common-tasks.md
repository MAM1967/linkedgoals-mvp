# Common Tasks & Debugging

This document provides a comprehensive guide for common development tasks and debugging procedures in the LinkedGoals MVP.

## How to Add New Features (Step-by-Step)

### 1. Planning & Setup

#### Create Feature Branch

```bash
# Pull latest main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/feature-name

# Example: git checkout -b feature/goal-sharing
```

#### Update Documentation

- Update relevant docs in `docs/` directory
- Add feature to `CHANGELOG.md`
- Update `README.md` if needed

### 2. Frontend Development

#### Add New Component

```bash
# Create component directory
mkdir src/components/NewFeature

# Create component files
touch src/components/NewFeature/NewFeature.tsx
touch src/components/NewFeature/NewFeature.css
touch src/components/NewFeature/index.ts
```

#### Component Template

```typescript
// src/components/NewFeature/NewFeature.tsx
import React, { useState, useEffect } from "react";
import { auth, db } from "../../lib/firebase";
import "./NewFeature.css";

interface NewFeatureProps {
  // Define props
}

const NewFeature: React.FC<NewFeatureProps> = ({}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Component logic
  }, []);

  const handleAction = async () => {
    setLoading(true);
    setError(null);

    try {
      // Feature logic
      console.log("Feature action completed");
    } catch (err) {
      console.error("Feature error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-feature">
      {error && <p className="error-message">{error}</p>}
      {/* Component JSX */}
    </div>
  );
};

export default NewFeature;
```

#### Add Routing (if needed)

```typescript
// src/App.tsx - Add new route
<Route path="/new-feature" element={<NewFeature />} />
```

### 3. Backend Development (Cloud Functions)

#### Create New Function

```typescript
// functions/src/newFeature.ts
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

export const newFeatureFunction = onCall(async (request) => {
  // Authentication check
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  // Input validation
  const { data } = request;
  if (!data || !data.requiredField) {
    throw new HttpsError("invalid-argument", "Required field missing");
  }

  try {
    const db = getFirestore();

    // Function logic
    const result = await performOperation(data);

    logger.info("New feature function executed successfully", {
      userId: request.auth.uid,
      data: result,
    });

    return { success: true, data: result };
  } catch (error: any) {
    logger.error("New feature function failed:", error);
    throw new HttpsError("internal", "Operation failed");
  }
});
```

#### Export Function

```typescript
// functions/src/index.ts
export { newFeatureFunction } from "./newFeature";
```

### 4. Database Changes

#### Update Firestore Security Rules

```javascript
// firestore.rules - Add new collection rules
match /newCollection/{docId} {
  allow read, write: if request.auth != null &&
    request.auth.uid == resource.data.userId;
}
```

#### Create Database Interfaces

```typescript
// src/types/index.ts
export interface NewFeatureData {
  id: string;
  userId: string;
  featureField: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 5. Testing

#### Write Unit Tests

```typescript
// src/components/NewFeature/__tests__/NewFeature.test.tsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NewFeature from "../NewFeature";

describe("NewFeature", () => {
  test("renders without crashing", () => {
    render(<NewFeature />);
    expect(screen.getByText(/new feature/i)).toBeInTheDocument();
  });

  test("handles user interaction", async () => {
    render(<NewFeature />);

    const button = screen.getByRole("button", { name: /action/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
  });
});
```

#### Write Integration Tests

```typescript
// src/__tests__/integration/NewFeature.integration.test.tsx
import { render, screen } from "@testing-library/react";
import { App } from "../../App";

describe("NewFeature Integration", () => {
  test("complete feature workflow", async () => {
    render(<App />);

    // Test complete user workflow
    // Navigate to feature
    // Interact with components
    // Verify results
  });
});
```

### 6. Deployment

#### Local Testing

```bash
# Start development server
npm run dev

# Run tests
npm run test
npm run test:integration

# Start Firebase emulators
npm run firebase:emulators
```

#### Deploy to Staging

```bash
# Build the project
npm run build

# Deploy functions
cd functions
npm run build
firebase deploy --only functions --project linkedgoals-staging

# Deploy frontend
firebase deploy --only hosting --project linkedgoals-staging
```

#### Deploy to Production

```bash
# Create pull request
git push origin feature/feature-name

# After review and merge to main
git checkout main
git pull origin main

# Deploy to production
firebase deploy --project linkedgoals-d7053
```

## Common Debugging Scenarios and Solutions

### Authentication Issues

#### LinkedIn OAuth Not Working

```bash
# Check environment variables
echo $VITE_LINKEDIN_CLIENT_ID
echo $VITE_LINKEDIN_REDIRECT_URI

# Check Cloud Function logs
firebase functions:log --only linkedinlogin

# Common fixes:
# 1. Verify LinkedIn app settings
# 2. Check redirect URI matches exactly
# 3. Verify scopes: "profile email" (not "openid")
# 4. Check for PKCE removal in code
```

#### Firebase Auth Token Issues

```typescript
// Debug auth state
import { onAuthStateChanged } from "firebase/auth";

onAuthStateChanged(auth, (user) => {
  console.log("Auth state changed:", user);
  if (user) {
    console.log("User token:", user.accessToken);
    console.log("User claims:", user.getIdTokenResult());
  }
});

// Force token refresh
user.getIdToken(true).then((token) => {
  console.log("Fresh token:", token);
});
```

### Firestore Issues

#### Permission Denied Errors

```typescript
// Check Firestore rules
console.log("Current user:", auth.currentUser);
console.log("User claims:", auth.currentUser?.getIdTokenResult());

// Test rule in console
// Go to Firestore > Rules tab > Rules playground
```

#### Real-time Listener Not Working

```typescript
// Debug Firestore listeners
import { onSnapshot } from "firebase/firestore";

const unsubscribe = onSnapshot(
  query,
  (snapshot) => {
    console.log("Snapshot received:", snapshot.docs.length);
    snapshot.docChanges().forEach((change) => {
      console.log("Document change:", change.type, change.doc.id);
    });
  },
  (error) => {
    console.error("Listener error:", error);
  }
);
```

### Cloud Functions Issues

#### Function Not Deployed

```bash
# Check deployment status
firebase functions:list

# Check function logs
firebase functions:log

# Redeploy specific function
firebase deploy --only functions:linkedinlogin

# Check function exists in console
# Go to Firebase Console > Functions
```

#### CORS Errors

```typescript
// Add CORS headers to HTTP functions
export const httpFunction = onRequest({ cors: true }, async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  // Function logic
});
```

### Frontend Issues

#### Component Not Rendering

```typescript
// Add debug logging
console.log("Component rendering with props:", props);
console.log("Component state:", state);

// Use React Developer Tools
// Install browser extension
// Inspect component tree and state

// Debug useEffect dependencies
useEffect(() => {
  console.log("Effect running with dependencies:", [dep1, dep2]);
}, [dep1, dep2]);
```

#### CSS Not Loading

```bash
# Check import statements
# Verify file paths
# Check for CSS modules configuration

# Clear browser cache
# Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (PC)
```

## Performance Profiling Tools and Techniques

### Frontend Performance

#### Chrome DevTools Performance Tab

```bash
# Steps to profile:
# 1. Open Chrome DevTools (F12)
# 2. Go to Performance tab
# 3. Click Record
# 4. Perform actions in app
# 5. Stop recording
# 6. Analyze timeline
```

#### React Developer Tools Profiler

```bash
# Install React DevTools browser extension
# Open DevTools > Profiler tab
# Start profiling session
# Interact with components
# Review component render times
```

#### Lighthouse Performance Audit

```bash
# Run Lighthouse audit
npm run test:performance

# Or manual audit:
# 1. Open Chrome DevTools
# 2. Go to Lighthouse tab
# 3. Select Performance
# 4. Generate report

# Key metrics to monitor:
# - First Contentful Paint (FCP)
# - Largest Contentful Paint (LCP)
# - Cumulative Layout Shift (CLS)
# - Time to Interactive (TTI)
```

#### Bundle Analysis

```bash
# Analyze bundle size
npm run analyze:bundle

# Check for:
# - Large dependencies
# - Duplicate packages
# - Unused code
```

### Backend Performance

#### Cloud Functions Monitoring

```bash
# View function metrics in Firebase Console
# Functions > [function-name] > Metrics

# Key metrics:
# - Invocation count
# - Error rate
# - Execution time
# - Memory usage
```

#### Firestore Performance

```typescript
// Enable Firestore performance monitoring
import { enableNetwork, disableNetwork } from "firebase/firestore";

// Monitor query performance
const startTime = Date.now();
const snapshot = await getDocs(query);
const duration = Date.now() - startTime;
console.log(`Query took ${duration}ms`);

// Use Firestore performance tab in Firebase Console
```

### Performance Optimization Techniques

#### Frontend Optimizations

```typescript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* Expensive rendering */}</div>;
});

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);

// Use useCallback for stable function references
const handleClick = useCallback(() => {
  // Handle click
}, [dependency]);

// Lazy load components
const LazyComponent = React.lazy(() => import("./LazyComponent"));

// Use Suspense for loading states
<Suspense fallback={<Loading />}>
  <LazyComponent />
</Suspense>;
```

#### Backend Optimizations

```typescript
// Batch Firestore operations
const batch = writeBatch(db);
batch.set(docRef1, data1);
batch.update(docRef2, data2);
await batch.commit();

// Use Firestore transactions for consistency
await runTransaction(db, async (transaction) => {
  const doc = await transaction.get(docRef);
  transaction.update(docRef, { count: doc.data().count + 1 });
});

// Optimize Cloud Function cold starts
// Keep functions warm with scheduled triggers
// Minimize function dependencies
// Use connection pooling
```

## How to Reproduce Production Issues Locally

### Environment Setup

#### Match Production Environment

```bash
# Use production environment variables
cp .env.production .env.local

# Use production Firebase project
export FIREBASE_PROJECT=linkedgoals-d7053

# Use production data (anonymized)
# Export from production Firestore
firebase firestore:export --project linkedgoals-d7053 ./production-data

# Import to local emulator
firebase emulators:start --import ./production-data
```

#### Enable Debug Logging

```typescript
// Enable verbose logging
localStorage.setItem("debug", "linkedgoals:*");

// Add production-style logging
const logger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[INFO] ${message}`, data);
    }
  },
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`, error);
    // Send to monitoring service in production
  },
};
```

### Specific Issue Types

#### User Authentication Issues

```bash
# Test with specific user account
# Create test user with same permissions
# Use production LinkedIn app settings

# Debug auth flow
# 1. Clear browser storage
# 2. Enable network tab in DevTools
# 3. Record auth flow
# 4. Compare with production logs
```

#### Goal Creation Failures

```typescript
// Reproduce with exact data
const testGoalData = {
  // Copy exact data from production logs
  specific: "Production user specific goal",
  measurable: { type: "Numeric", targetValue: 100 },
  // ... rest of data
};

// Test validation logic
console.log("Validating goal data:", testGoalData);
const isValid = validateGoalData(testGoalData);
console.log("Validation result:", isValid);
```

#### Performance Issues

```bash
# Simulate production load
# Use Chrome DevTools throttling
# Enable "Slow 3G" network
# Enable "6x CPU slowdown"

# Test with production data volume
# Import large dataset to emulator
# Test with 1000+ goals per user
```

### Data Debugging

#### Export Production Data

```bash
# Export specific collections (anonymized)
firebase firestore:export \
  --collection-ids=users,goals \
  --project linkedgoals-d7053 \
  ./debug-data

# Clean sensitive data
# Remove email addresses, names
# Replace with test@example.com, Test User
```

#### Query Production Issues

```typescript
// Use production query patterns
const reproQuery = query(
  collection(db, "users"),
  where("createdAt", ">=", specificDate),
  orderBy("createdAt", "desc"),
  limit(50)
);

// Log query performance
const startTime = Date.now();
const snapshot = await getDocs(reproQuery);
console.log(`Query took ${Date.now() - startTime}ms`);
console.log(`Returned ${snapshot.docs.length} documents`);
```

## Useful Debugging Commands and Tools

### Development Commands

#### Firebase CLI Commands

```bash
# View project info
firebase projects:list
firebase use --add

# Function management
firebase functions:list
firebase functions:log --only linkedinlogin
firebase functions:delete functionName

# Emulator commands
firebase emulators:start --only firestore,auth
firebase emulators:export ./emulator-backup
firebase emulators:start --import ./emulator-backup

# Hosting commands
firebase hosting:channel:list
firebase hosting:channel:deploy preview-branch
firebase hosting:channel:delete preview-branch
```

#### NPM Scripts Reference

```bash
# Development
npm run dev                 # Start dev server
npm run build              # Build for production
npm run preview           # Preview production build

# Testing
npm run test              # Run unit tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run tests with coverage
npm run test:integration  # Run integration tests
npm run test:e2e          # Run end-to-end tests
npm run test:e2e:open     # Open Cypress UI

# Quality assurance
npm run lint              # Run ESLint
npm run audit:security    # Security audit
npm run test:performance  # Lighthouse audit

# Firebase
npm run firebase:emulators # Start Firebase emulators
```

#### Git Commands for Debugging

```bash
# Find when bug was introduced
git bisect start
git bisect bad HEAD
git bisect good [last-known-good-commit]

# View file history
git log --follow -- path/to/file
git blame path/to/file

# Compare branches
git diff main..feature-branch
git diff --name-only main..feature-branch

# Stash debugging changes
git stash push -m "debugging session"
git stash list
git stash apply stash@{0}
```

### Browser Developer Tools

#### Console Commands

```javascript
// Clear console
console.clear();

// View Firebase user
console.log("Current user:", window.firebase?.auth?.currentUser);

// Test Firestore connection
window.firebase?.firestore
  ?.doc("test/test")
  .get()
  .then(() => console.log("Firestore connected"))
  .catch((err) => console.error("Firestore error:", err));

// View localStorage data
console.log("Local storage:", { ...localStorage });

// View sessionStorage data
console.log("Session storage:", { ...sessionStorage });
```

#### Network Tab Debugging

```bash
# Monitor specific requests
# 1. Open DevTools > Network tab
# 2. Filter by "Fetch/XHR"
# 3. Look for Firebase/LinkedIn API calls
# 4. Check request/response headers
# 5. Verify request payload

# Common issues to check:
# - CORS headers
# - Authentication tokens
# - Request timeouts
# - Response status codes
```

### Debugging Browser Extensions

#### React Developer Tools

- Component tree inspection
- Props and state viewing
- Performance profiling
- Hook debugging

#### Firebase Developer Tools

- Real-time database monitoring
- Auth state inspection
- Performance monitoring

#### Redux DevTools (if applicable)

- State time travel
- Action replay
- State diff viewing

### VS Code Debugging

#### Launch Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug React App",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/vite",
      "args": ["dev"],
      "env": {
        "NODE_ENV": "development"
      }
    },
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand"],
      "console": "integratedTerminal"
    }
  ]
}
```

#### Useful VS Code Extensions

- Firebase Explorer
- ES7+ React/Redux/React-Native snippets
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens
- Thunder Client (API testing)

### Production Debugging Tools

#### Firebase Console

- **Authentication**: User management, provider settings
- **Firestore**: Data browser, security rules, indexes
- **Functions**: Logs, metrics, environment variables
- **Hosting**: Deployment history, custom domains
- **Performance**: App performance metrics
- **Analytics**: User behavior, custom events

#### Google Cloud Console

- **Cloud Functions**: Detailed metrics, scaling settings
- **Cloud Firestore**: Query performance, billing
- **Cloud Storage**: File management, access controls
- **Error Reporting**: Crash analytics
- **Cloud Monitoring**: Custom dashboards, alerting

### Log Analysis Tools

#### Parsing Firebase Function Logs

```bash
# Filter logs by severity
firebase functions:log --only linkedinlogin | grep ERROR

# Parse JSON logs
firebase functions:log --only linkedinlogin | jq '.severity == "ERROR"'

# Export logs for analysis
firebase functions:log --only linkedinlogin > debug-logs.txt
```

#### Log Monitoring Patterns

```typescript
// Structured logging for easier parsing
const logMessage = {
  timestamp: new Date().toISOString(),
  level: "ERROR",
  function: "linkedinLogin",
  userId: user.uid,
  error: error.message,
  context: { step: "token_exchange", attempt: 1 },
};

console.log(JSON.stringify(logMessage));
```

### Quick Debugging Checklist

#### When Something's Not Working:

1. ✅ Check browser console for errors
2. ✅ Verify network requests in DevTools
3. ✅ Check Firebase function logs
4. ✅ Confirm environment variables are set
5. ✅ Test with fresh browser session
6. ✅ Clear browser cache and localStorage
7. ✅ Check Firebase service status
8. ✅ Verify Firestore security rules
9. ✅ Test with different user account
10. ✅ Compare with working environment

#### Emergency Production Debugging:

1. 🚨 Check Firebase Console for outages
2. 🚨 Review recent deployments in Git history
3. 🚨 Check function logs for error patterns
4. 🚨 Monitor real-time metrics
5. 🚨 Roll back to last known good version if needed
6. 🚨 Communicate status to stakeholders

This comprehensive debugging guide should help developers quickly identify and resolve issues in the LinkedGoals MVP application.
