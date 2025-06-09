# Known Issues & Technical Debt

This document lists the known issues, bugs, and areas of technical debt in the LinkedGoals MVP project.

## Current Bugs That Are Accepted/Postponed

### 1. Admin Dashboard Browser Compatibility

**Issue**: Admin dashboard has minor UI inconsistencies in older browsers (Internet Explorer 11, Safari < 14)
**Impact**: Low - affects <5% of users
**Reason for postponement**: Focus on modern browser support for MVP launch
**Planned fix**: Post-MVP v1.1
**Workaround**: Users can use Chrome, Firefox, or modern Safari

### 2. Mobile LinkedIn OAuth Flow

**Issue**: LinkedIn OAuth occasionally requires two taps on mobile devices due to popup window behavior
**Impact**: Medium - affects mobile users during login
**Reason for postponement**: Complex mobile browser popup handling, low frequency
**Planned fix**: Post-MVP when implementing native mobile app
**Workaround**: Users can refresh and try again, usually works on second attempt

### 3. Goal Progress Chart Animation Performance

**Issue**: Chart animations may stutter on low-end mobile devices with >50 goals
**Impact**: Low - affects power users with many goals on older devices
**Reason for postponement**: Performance optimization planned for post-MVP
**Planned fix**: v1.2 - Chart virtualization and lazy loading
**Workaround**: Disable animations in accessibility settings

### 4. Firestore Offline Mode Limitations

**Issue**: Limited offline functionality - users cannot create goals without internet connection
**Impact**: Medium - affects users with poor connectivity
**Reason for postponement**: Complex offline sync implementation, not critical for MVP
**Planned fix**: v2.0 - Progressive Web App with full offline support
**Workaround**: Users should connect to stable internet when creating goals

### 5. Real-time Updates Delay

**Issue**: Goal updates from other devices may take 5-10 seconds to appear due to Firestore listener latency
**Impact**: Low - rarely affects single-user workflow
**Reason for postponement**: Firebase infrastructure limitation, acceptable for MVP
**Planned fix**: Consider alternative real-time solutions in v2.0
**Workaround**: Manual refresh if immediate sync is needed

## Areas of Technical Debt with Context

### 1. Authentication Flow Complexity

**Location**: `src/components/LinkedInCallback.tsx`, `functions/src/index.ts`
**Issue**: LinkedIn OAuth implementation has evolved through multiple iterations, leaving some redundant code paths
**Context**: Originally implemented PKCE, then removed due to LinkedIn API constraints
**Impact**: Medium - code is harder to maintain and debug
**Plan**: Refactor authentication flow in v1.1 to simplify and add better error handling

```typescript
// TODO: Simplify authentication flow
// Current implementation has multiple fallback paths that could be consolidated
const handleLinkedInAuth = async (code: string) => {
  // Multiple try-catch blocks could be simplified
  // Error handling could be more granular
};
```

### 2. Mixed State Management Patterns

**Location**: Various components throughout `src/components/`
**Issue**: Some components use React hooks, others use prop drilling, inconsistent patterns
**Context**: Rapid MVP development led to different approaches being used
**Impact**: Medium - makes code harder to understand and maintain
**Plan**: Standardize on React Context + hooks pattern in v1.2

```typescript
// TODO: Standardize state management
// Some components pass props 3+ levels deep
// Some use local state when global state would be better
```

### 3. Form Validation Inconsistency

**Location**: `src/components/GoalInputPage.tsx`, admin forms
**Issue**: Client-side validation logic is duplicated and not centralized
**Context**: Different forms were built at different times with different patterns
**Impact**: Medium - validation logic is hard to maintain and test
**Plan**: Create centralized validation library in v1.1

```typescript
// TODO: Create reusable validation utilities
// Current: Each form has its own validation logic
// Goal: Central validation with consistent error messages
```

### 4. Error Handling Verbosity

**Location**: Cloud Functions (`functions/src/index.ts`)
**Issue**: Error handling is verbose and could be abstracted into utility functions
**Context**: Added comprehensive error handling for debugging during development
**Impact**: Low - functions work correctly but are harder to read
**Plan**: Extract error handling utilities in v1.1

```typescript
// TODO: Extract error handling patterns
export const withErrorHandling = (fn: Function) => {
  return async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      // Centralized error handling logic
    }
  };
};
```

### 5. CSS Architecture

**Location**: Component-specific CSS files throughout `src/`
**Issue**: No consistent CSS architecture, some global styles, some component-specific
**Context**: Rapid prototyping led to inconsistent styling approaches
**Impact**: Medium - difficult to maintain consistent design system
**Plan**: Implement CSS-in-JS or CSS modules in v1.2

### 6. Test Coverage Gaps

**Location**: Missing tests for admin components and integration flows
**Issue**: Admin dashboard and LinkedIn OAuth integration have limited test coverage
**Context**: Admin features were added later in development cycle
**Impact**: Medium - harder to detect regressions in admin functionality
**Plan**: Increase test coverage to >90% in v1.1

## Performance Bottlenecks

### 1. Firestore Query Optimization

**Location**: `src/components/Dashboard.tsx`
**Issue**: Dashboard loads all user goals without pagination
**Impact**: High - page load time increases significantly for users with >50 goals
**Metrics**: Load time increases from 2s to 8s with 100+ goals
**Solution**: Implement pagination and virtual scrolling
**Timeline**: v1.1 release

```typescript
// Current: Loads all goals at once
const loadAllGoals = async () => {
  const snapshot = await getDocs(collection(db, `users/${userId}/goals`));
  // Processes all documents immediately
};

// Planned: Paginated loading
const loadGoalsPaginated = async (limit = 20, startAfter?) => {
  // Implement cursor-based pagination
};
```

### 2. Bundle Size Optimization

**Issue**: Main JavaScript bundle is 850KB gzipped
**Impact**: Medium - affects users on slow connections
**Analysis**:

- Chart.js library: 180KB (necessary for goal progress charts)
- Firebase SDK: 220KB (necessary for backend)
- React Router: 45KB (necessary for routing)
- FontAwesome icons: 125KB (could be optimized)
  **Solution**: Implement tree shaking and icon optimization
  **Timeline**: v1.1 release

### 3. Image Loading Performance

**Location**: User profile pictures, shared goal previews
**Issue**: Images not optimized for web, no lazy loading
**Impact**: Medium - affects page load speed
**Solution**: Implement WebP format, lazy loading, and image CDN
**Timeline**: v1.2 release

### 4. Firestore Connection Pooling

**Location**: Multiple components making simultaneous Firestore calls
**Issue**: Each component creates its own Firestore connection
**Impact**: Low-Medium - could be more efficient
**Solution**: Implement connection pooling and request batching
**Timeline**: v2.0 when scaling becomes critical

### 5. Mobile Rendering Performance

**Issue**: Complex DOM structure causes reflow on mobile devices
**Impact**: Medium - affects user experience on mobile
**Metrics**: First paint time >3s on older Android devices
**Solution**: Implement React.memo and useMemo optimizations
**Timeline**: v1.1 release

## Security Considerations

### 1. Admin Role Privilege Escalation

**Status**: ⚠️ **Medium Priority**
**Issue**: Admin users can modify their own admin status through Firestore rules
**Location**: `firestore.rules`
**Risk**: Admin could accidentally remove their own admin access
**Mitigation**:

- Document clear admin management procedures
- Implement "super admin" role for user management
- Add confirmation dialogs for admin role changes
  **Timeline**: v1.1 release

```javascript
// Current rule allows admins to modify any user document
match /users/{userId} {
  allow write: if isAdmin();
}

// Should be: Prevent admins from modifying their own role
match /users/{userId} {
  allow write: if isAdmin() &&
    (request.auth.uid != userId ||
     !("role" in request.resource.data) ||
     request.resource.data.role == resource.data.role);
}
```

### 2. Client-Side Environment Variable Exposure

**Status**: ✅ **Low Priority - By Design**
**Issue**: Firebase configuration is exposed in client-side bundle
**Location**: `src/lib/firebase.ts`
**Risk**: Firebase project details are publicly visible
**Assessment**: This is normal for Firebase applications
**Mitigation**: Security relies on Firestore rules, not configuration secrecy
**Action**: Document this as expected behavior

### 3. LinkedIn OAuth State Parameter

**Status**: ✅ **Resolved**
**Issue**: OAuth state parameter validation could be stronger
**Location**: `src/components/LinkedInCallback.tsx`
**Resolution**: Added cryptographically secure state generation and validation
**Verification**: Tested against CSRF attacks

### 4. User Data Access Logging

**Status**: ⚠️ **Medium Priority**
**Issue**: Limited audit trail for admin actions on user data
**Location**: Admin dashboard functions
**Risk**: Difficulty tracking data access for compliance
**Solution**: Implement comprehensive audit logging
**Timeline**: v1.1 for GDPR compliance

### 5. Rate Limiting

**Status**: ⚠️ **Medium Priority**
**Issue**: No rate limiting on Cloud Functions
**Location**: `functions/src/index.ts`
**Risk**: Potential for abuse or DoS attacks
**Solution**: Implement Firebase App Check and rate limiting
**Timeline**: v1.2 before scaling

## Planned Refactoring Initiatives

### 1. Authentication System Refactor (v1.1)

**Scope**: Complete authentication flow simplification
**Benefits**:

- Easier to maintain and debug
- Better error handling and user messaging
- Improved security with proper session management
  **Timeline**: 2-3 weeks
  **Risk**: Medium - core functionality change

**Tasks**:

- [ ] Consolidate LinkedIn OAuth flow
- [ ] Add proper session management
- [ ] Implement refresh token handling
- [ ] Add comprehensive error boundary
- [ ] Update documentation

### 2. State Management Standardization (v1.2)

**Scope**: Implement consistent state management across application
**Benefits**:

- Reduced prop drilling
- Easier state debugging
- Better performance with selective re-renders
- Clearer data flow
  **Timeline**: 3-4 weeks
  **Risk**: Low - gradual migration possible

**Tasks**:

- [ ] Design global state structure
- [ ] Implement React Context providers
- [ ] Convert components to use centralized state
- [ ] Add state debugging tools
- [ ] Update testing patterns

### 3. Performance Optimization Initiative (v1.1)

**Scope**: Address major performance bottlenecks
**Benefits**:

- Faster page loads
- Better mobile experience
- Reduced server costs
- Improved user retention
  **Timeline**: 2 weeks
  **Risk**: Low - mostly additive changes

**Tasks**:

- [ ] Implement goal pagination
- [ ] Add React.memo optimizations
- [ ] Optimize bundle size
- [ ] Add performance monitoring
- [ ] Implement lazy loading

### 4. Testing Infrastructure Improvement (v1.1)

**Scope**: Increase test coverage and improve test reliability
**Benefits**:

- Fewer production bugs
- Safer refactoring
- Better code documentation
- Improved development velocity
  **Timeline**: 2-3 weeks
  **Risk**: Low - non-breaking changes

**Tasks**:

- [ ] Add admin dashboard tests
- [ ] Implement E2E test suite
- [ ] Add performance regression tests
- [ ] Set up visual regression testing
- [ ] Improve CI/CD pipeline

### 5. Security Hardening (v1.2)

**Scope**: Address security considerations and improve audit capabilities
**Benefits**:

- Better compliance posture
- Reduced security risk
- Improved monitoring
- Better incident response
  **Timeline**: 2-3 weeks
  **Risk**: Medium - security changes need careful testing

**Tasks**:

- [ ] Implement comprehensive audit logging
- [ ] Add rate limiting
- [ ] Improve admin role management
- [ ] Add security monitoring
- [ ] Conduct security audit

### 6. Database Schema Optimization (v2.0)

**Scope**: Optimize Firestore schema for better performance and scalability
**Benefits**:

- Faster queries
- Reduced costs
- Better data consistency
- Easier analytics
  **Timeline**: 4-6 weeks
  **Risk**: High - requires data migration

**Tasks**:

- [ ] Design optimized schema
- [ ] Create migration scripts
- [ ] Implement gradual migration
- [ ] Update all queries
- [ ] Performance testing

## Issue Tracking and Resolution Process

### Priority Levels

- **Critical (P0)**: Security vulnerabilities, data loss, application down
- **High (P1)**: Major functionality broken, significant user impact
- **Medium (P2)**: Minor functionality issues, performance problems
- **Low (P3)**: UI/UX improvements, technical debt

### Resolution Timeline Targets

- P0: Immediate (< 4 hours)
- P1: 1-2 days
- P2: 1-2 weeks
- P3: Next planned release

### Monitoring and Detection

- **Error Tracking**: Sentry (planned for v1.1)
- **Performance Monitoring**: Firebase Performance + Google Analytics
- **User Feedback**: In-app feedback widget
- **Analytics**: Custom events for error tracking

### Communication

- **Critical Issues**: Slack notification + email
- **Status Updates**: Weekly team standup
- **User Communication**: In-app notifications for known issues

This living document is updated with each release and reviewed monthly by the development team.
