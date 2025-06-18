# Email Verification Implementation Plan - Technical Specification

## Executive Summary

Based on memory [preserving dashboard working state][memory:8982985115591401595]], this plan provides specific, implementable steps to add email verification while maintaining the working dashboard from commit 91f1de5.

## Current State Analysis

**Working Baseline**: Commit 91f1de5, branch `dashboard-working-no-email-banner`
**Key Challenge**: EmailVerificationBanner causes `getIdToken is not a function` errors
**Goal**: Add email verification without breaking authentication flow

## Architecture Overview

### 1. Enhanced Authentication Hook (`useAuth.ts`)

```typescript
import { useState, useEffect, useCallback } from "react";
import {
  onAuthStateChanged,
  User,
  sendEmailVerification,
  reload,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

interface AuthUser extends User {
  isAdmin?: boolean;
}

interface EmailVerificationState {
  canResend: boolean;
  lastSentTime: Date | null;
  resendCooldown: number;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailVerificationState, setEmailVerificationState] =
    useState<EmailVerificationState>({
      canResend: true,
      lastSentTime: null,
      resendCooldown: 0,
    });

  const reloadUser = useCallback(async () => {
    if (auth.currentUser) {
      try {
        await reload(auth.currentUser);
        // Force re-evaluation of auth state
      } catch (error) {
        console.error("Error reloading user:", error);
      }
    }
  }, []);

  const sendVerificationEmail = useCallback(async () => {
    if (!auth.currentUser || !emailVerificationState.canResend) {
      return { success: false, error: "Cannot send verification email" };
    }

    try {
      await sendEmailVerification(auth.currentUser, {
        url: "https://app.linkedgoals.app/",
        handleCodeInApp: false,
      });

      setEmailVerificationState({
        canResend: false,
        lastSentTime: new Date(),
        resendCooldown: 60,
      });

      setTimeout(() => {
        setEmailVerificationState((prev) => ({
          ...prev,
          canResend: true,
          resendCooldown: 0,
        }));
      }, 60000);

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [emailVerificationState.canResend]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      try {
        if (currentUser) {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists() && userDoc.data().role === "admin") {
            setUser({ ...currentUser, isAdmin: true });
          } else {
            setUser(currentUser);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    loading,
    emailVerificationState,
    reloadUser,
    sendVerificationEmail,
  };
}
```

### 2. Safe Email Verification Banner

```typescript
// src/components/SafeEmailVerificationBanner.tsx
import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import "./SafeEmailVerificationBanner.css";

export const SafeEmailVerificationBanner: React.FC = () => {
  const { user, emailVerificationState, sendVerificationEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Safe check - only show for unverified users
  if (!user || user.emailVerified) {
    return null;
  }

  const handleResendEmail = async () => {
    setIsLoading(true);
    setMessage(null);

    const result = await sendVerificationEmail();

    if (result.success) {
      setMessage("Verification email sent! Check your inbox.");
    } else {
      setMessage("Failed to send email. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <div className="safe-email-verification-banner">
      <div className="banner-content">
        <span className="banner-icon">📧</span>
        <div className="banner-text">
          <strong>Please verify your email address</strong>
          <p>Check your inbox for a verification link</p>
        </div>
        <button
          onClick={handleResendEmail}
          disabled={!emailVerificationState.canResend || isLoading}
          className="resend-button"
        >
          {isLoading ? "Sending..." : "Resend"}
        </button>
      </div>
      {message && <div className="banner-message">{message}</div>}
    </div>
  );
};

export default SafeEmailVerificationBanner;
```

### 3. Banner CSS

```css
/* src/components/SafeEmailVerificationBanner.css */
.safe-email-verification-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.banner-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.banner-text {
  flex: 1;
}

.banner-text strong {
  display: block;
  margin-bottom: 4px;
  font-size: 16px;
}

.banner-text p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.resend-button {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.resend-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.resend-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.banner-message {
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-size: 14px;
}
```

## Implementation Steps

### Step 1: Update useAuth Hook

1. Back up current `src/hooks/useAuth.ts`
2. Replace with enhanced version above
3. Test authentication still works

### Step 2: Create Safe Banner Component

1. Create `src/components/SafeEmailVerificationBanner.tsx`
2. Create `src/components/SafeEmailVerificationBanner.css`
3. Test component in isolation

### Step 3: Minimal Dashboard Integration

```typescript
// In src/components/Dashboard.tsx - ONLY add these two lines:

// Add import at top with other imports
import SafeEmailVerificationBanner from "./SafeEmailVerificationBanner";

// Add component in dashboard container (first thing inside .dashboard div)
<div className="dashboard">
  <SafeEmailVerificationBanner />
  {/* All existing dashboard code unchanged */}
  <DashboardHeader
    userName={user?.displayName || "Guest"}
    userPhotoURL={user?.photoURL}
  />
  // ... rest unchanged
</div>;
```

### Step 4: Configure Firebase Email Template

In Firebase Console → Authentication → Templates:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Verify your LinkedGoals account</title>
  </head>
  <body
    style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"
  >
    <h1 style="color: #667eea;">LinkedGoals</h1>
    <h2>Verify your email address</h2>
    <p>
      Welcome to LinkedGoals! Please verify your email address by clicking the
      button below:
    </p>
    <div style="text-align: center; margin: 30px 0;">
      <a
        href="%{link}"
        style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;"
      >
        Verify Email Address
      </a>
    </div>
    <p>If the button doesn't work, copy this link: %{link}</p>
    <hr />
    <p style="color: #666; font-size: 14px;">
      If you didn't create this account, ignore this email.
    </p>
  </body>
</html>
```

### Step 5: Testing Protocol

1. **Authentication Test**

   ```bash
   npm run dev
   # Verify login/logout still works
   # Check dashboard loads correctly
   ```

2. **Email Verification Test**

   ```bash
   # Create new account
   # Check banner appears for unverified users
   # Test resend functionality
   # Verify banner disappears after verification
   ```

3. **Regression Test**
   ```bash
   # Test all existing dashboard features
   # Check admin functionality
   # Verify no authentication errors
   ```

## Risk Mitigation

### Critical Rules to Follow:

1. **Never modify Dashboard.tsx imports beyond adding SafeEmailVerificationBanner**
2. **Always test on branch before merging**
3. **Keep backup of working commit 91f1de5**
4. **Test authentication flow after each change**

### Rollback Plan:

```bash
# If anything breaks:
git checkout dashboard-working-no-email-banner
git reset --hard 91f1de5
```

## Success Criteria

1. **Dashboard continues to work exactly as before**
2. **Email verification banner shows for unverified users**
3. **Banner disappears for verified users**
4. **Resend email functionality works**
5. **No authentication errors in console**

## Deployment Timeline

- **Day 1**: Enhanced useAuth hook (2-3 hours)
- **Day 2**: Safe banner component (2-3 hours)
- **Day 3**: Dashboard integration + testing (4-5 hours)
- **Day 4**: Firebase configuration + final testing (2-3 hours)

**Total**: 4 days maximum

This plan focuses on minimal, safe changes that preserve the working dashboard while adding email verification functionality incrementally with extensive testing at each step.
