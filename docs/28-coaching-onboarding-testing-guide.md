# Coaching Onboarding Testing Guide

## Overview

This guide provides step-by-step instructions for testing the coaching onboarding workflow using real Firestore data via emulators.

## Prerequisites

- Firebase emulators running locally
- Java runtime installed (OpenJDK 11+ recommended)
- Development server running on localhost:5173

## Setup & Testing Workflow

### 1. Install Java (if needed)

```bash
# macOS with Homebrew
brew install openjdk@11
export PATH="/opt/homebrew/opt/openjdk@11/bin:$PATH"

# Verify installation
java -version
```

### 2. Start Firebase Emulators

```bash
# Start emulators with development-friendly rules
firebase emulators:start
```

**Emulator URLs:**

- Firestore: http://127.0.0.1:8080
- Auth: http://127.0.0.1:9099
- Firebase UI: http://127.0.0.1:4000

### 3. Seed Test Data

Navigate to the data seeder page:

```
http://localhost:5173/seed-data
```

Click **"🌱 Seed Test Data"** to create:

- Sarah Johnson (MBA goal)
- Mike Chen (marathon goal)
- Professional Coach account

### 4. Test Coaching Onboarding

Use the generated URLs from the seeder:

**Sarah's MBA Goal:**

```
http://localhost:5173/coach-onboarding?inviterId=test-user-sarah-johnson&goalId=test-goal-mba-degree&inviterName=Sarah%20Johnson
```

**Mike's Marathon Goal:**

```
http://localhost:5173/coach-onboarding?inviterId=test-user-mike-chen&goalId=test-goal-fitness&inviterName=Mike%20Chen
```

### 5. Test Different States

#### State 1: Not Logged In

- Visit coaching URL while logged out
- Should see welcome message with goal description
- LinkedIn login button should be visible

#### State 2: Accept Invitation

- Sign in with LinkedIn OAuth
- Should automatically accept coaching invitation
- Success message should appear with navigation options

#### State 3: Navigation Options

- **"Go to My Dashboard"** → Personal goals dashboard
- **"View Coaching Goals"** → Coaching dashboard with assigned goals

#### State 4: Error States

- Try self-coaching (same user as inviter)
- Try accepting already-coached goal
- Try invalid/missing parameters

### 6. Demo Page

View all onboarding states at once:

```
http://localhost:5173/coach-onboarding-demo
```

## Troubleshooting

### Java Runtime Issues

```bash
# If "No Java runtime present" error:
export JAVA_HOME="/opt/homebrew/opt/openjdk@11/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
```

### Permission Denied Errors

Ensure firestore.rules allows development operations:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Development only
    }
  }
}
```

### Connection Issues

- Verify emulators are running on correct ports
- Check `src/lib/firebase.ts` uses localhost addresses
- Restart emulators if connection fails

## Data Cleanup

```bash
# Clear test data via seeder UI
http://localhost:5173/seed-data
# Click "🧹 Clear Test Data"

# Or restart emulators (clears all data)
firebase emulators:start
```

## Coaching Dashboard Testing

After accepting coaching invitation:

1. Navigate to `/coaching` route
2. Should see assigned goals with coach interface
3. Test progress tracking and note-taking features
4. Verify navigation between personal and coaching dashboards

## Key Test Scenarios

- ✅ End-to-end invitation acceptance flow
- ✅ Authentication integration with coaching context
- ✅ Real data display instead of mock data
- ✅ Navigation between personal/coaching dashboards
- ✅ Error handling for edge cases
- ✅ Mobile responsiveness of onboarding pages
- ✅ Coaching dashboard functionality

## Notes

- Always use development Firebase rules for testing
- Test data is isolated to emulator environment
- Production database remains unaffected
- Use different browsers/incognito for multi-user testing

---

**Last Updated**: December 2024  
**Maintained By**: Development Team
