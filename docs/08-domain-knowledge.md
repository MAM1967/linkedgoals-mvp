# Business Logic & Domain Knowledge

This document captures the core business logic and domain-specific knowledge of the LinkedGoals MVP application.

## Core Business Rules and Constraints

### SMART Goals Framework

LinkedGoals is built around the SMART goal framework with the following constraints:

- **Specific**: Must be at least 10 characters, descriptive text required
- **Measurable**: Must select one of four measurement types:
  - **Numeric**: Requires target value and unit (e.g., "20 pages", "5 hours")
  - **Date**: Requires target date for milestone completion
  - **DailyStreak**: Requires number of consecutive days target
  - **Boolean**: Simple done/not done tracking
- **Achievable**: Must provide reasoning (minimum 10 characters)
- **Relevant**: Must explain relevance (minimum 10 characters)
- **Time-bound**: Must set a future due date

### Goal Management Rules

#### Goal Creation Constraints

- **Maximum Goals**: 50 goals per user (configurable via environment)
- **Category Required**: Must select from predefined MVP categories:
  - Health & Fitness
  - Career Development
  - Personal Development
  - Finance
  - Education
  - Skills
  - Relationships
  - Travel
- **Future Dates Only**: Due dates must be in the future
- **Validation**: All SMART components must be completed before saving

#### Goal Status Lifecycle

```
active → completed
active → overdue (automatically after due date)
completed → active (can be reopened)
```

#### Progress Update Rules

- **Numeric Goals**: Can increment current value, capped at target value
- **DailyStreak Goals**: Increments by 1 per day, resets if day is missed
- **Boolean Goals**: Can be marked done, requires confirmation to undo
- **Date Goals**: Progress tracked as time elapsed vs. time remaining

### Data Ownership and Access

- **User Isolation**: Users can only access their own goals and data
- **Admin Override**: Admin users can access all user data for management
- **Sharing**: Goals can be shared via unique URLs if user enables sharing
- **Guest Access**: Shared goals viewable without authentication

## User Roles and Permissions System

### Role Hierarchy

```
admin > user > guest
```

### Standard User (`role: "user"` or no role field)

**Permissions:**

- ✅ Create, read, update, delete their own goals
- ✅ View their own profile and statistics
- ✅ Share goals publicly (optional)
- ✅ Update their own progress
- ✅ Access main application features
- ❌ Cannot access admin dashboard
- ❌ Cannot view other users' data
- ❌ Cannot perform admin actions

**Authentication:**

- LinkedIn OAuth (primary)
- Firebase Auth integration
- Automatic user document creation on first login

### Admin User (`role: "admin"`)

**Permissions:**

- ✅ All user permissions
- ✅ Access admin dashboard at `/admin`
- ✅ View all users and their data (GDPR compliant)
- ✅ Disable/enable user accounts
- ✅ Delete user accounts (with confirmation)
- ✅ View platform-wide metrics
- ✅ Access all goals across users
- ✅ Perform user management operations

**Authentication:**

- Separate email/password login (not OAuth)
- Role verified in Firestore on each request
- Protected routes with role checking

### Guest User (unauthenticated)

**Permissions:**

- ✅ View shared goals via public URLs
- ✅ Access landing page
- ❌ Cannot create accounts
- ❌ Cannot access application features
- ❌ Cannot view private data

## Workflow Descriptions for Complex Features

### Goal Creation Workflow

1. **Authentication Check**

   - Verify user is logged in
   - Redirect to login if not authenticated

2. **Step-by-Step Form (7 steps)**

   - Step 1: Goal Description (overview)
   - Step 2: Category Selection
   - Step 3: Specific (what exactly)
   - Step 4: Measurable (how to measure)
   - Step 5: Achievable (why it's realistic)
   - Step 6: Relevant (why it matters)
   - Step 7: Time-bound (due date)

3. **Validation & Storage**
   - Client-side validation on each step
   - Final validation before saving
   - Firestore document creation with server timestamp
   - Success confirmation and redirect to dashboard

### LinkedIn OAuth Authentication Workflow

1. **Initial Request**

   - User clicks "Sign in with LinkedIn"
   - Frontend generates state parameter for security
   - Redirect to LinkedIn with correct scopes (`profile email`)

2. **LinkedIn Authorization**

   - User authorizes LinkedGoals access
   - LinkedIn redirects with authorization code

3. **Token Exchange (Backend)**

   - Cloud Function receives authorization code
   - Exchanges code for access token (standard OAuth 2.0)
   - No PKCE verification (as per LinkedIn requirements)

4. **Profile & Email Fetching**

   - Fetch user profile from LinkedIn API v2: `/v2/me`
   - Fetch email from LinkedIn API v2: `/v2/emailAddresses`

5. **Firebase User Creation**

   - Create or update Firebase user document
   - Generate custom Firebase token
   - Return token to frontend

6. **Frontend Authentication**
   - Sign in with custom token
   - Redirect to dashboard or intended page

### Admin User Management Workflow

1. **Authentication Verification**

   - Check Firebase Auth status
   - Verify admin role in Firestore
   - Redirect to admin login if unauthorized

2. **User List Display**

   - Paginated queries (50 users per page)
   - Real-time status indicators
   - Search and filter capabilities

3. **User Actions**
   - **Disable**: Set `disabled: true` in Auth, preserve data
   - **Enable**: Set `disabled: false` in Auth
   - **Delete**: Confirmation dialog → Delete from Auth and Firestore
   - All actions logged for audit trail

### Progress Update Workflow

1. **Goal Type Detection**

   - Identify measurable type (Numeric, Date, DailyStreak, Boolean)
   - Load current and target values

2. **Type-Specific Updates**

   - **Numeric**: Increment by 1 or custom amount
   - **DailyStreak**: Check last update date, increment or reset
   - **Boolean**: Toggle completion status
   - **Date**: Calculate percentage based on time elapsed

3. **Persistence & UI Update**
   - Update Firestore document
   - Update local state immediately
   - Show visual progress indicators
   - Update streak counters and badges

## Edge Cases and How They're Handled

### Authentication Edge Cases

**LinkedIn API Failures**

- **Rate Limiting**: Exponential backoff retry mechanism
- **Network Timeouts**: 10-second timeout with error messages
- **Invalid Tokens**: Clear auth state and redirect to login
- **Scope Denial**: Graceful failure with explanation

**Session Management**

- **Token Expiration**: Automatic refresh or re-authentication
- **Concurrent Sessions**: Firebase handles multi-device sessions
- **Admin Session Security**: 24-hour timeout for admin sessions

### Goal Management Edge Cases

**Date Validation**

- **Past Dates**: Client and server validation prevents past due dates
- **Invalid Formats**: Date picker ensures proper format
- **Timezone Issues**: All dates stored as UTC, displayed in user timezone

**Progress Tracking Edge Cases**

- **Negative Progress**: Prevented by UI constraints and validation
- **Exceeding Targets**: Numeric goals can exceed target (celebrates over-achievement)
- **Missed Streaks**: DailyStreak resets to 0 if 24+ hours since last update
- **Concurrent Updates**: Firestore transactions prevent race conditions

**Data Consistency**

- **Partial Saves**: Form validation prevents incomplete goal creation
- **Network Failures**: Optimistic updates with rollback on failure
- **Browser Crashes**: Auto-save drafts to localStorage

### Admin Dashboard Edge Cases

**Large User Bases**

- **Pagination Performance**: Firestore cursor-based pagination
- **Search Scaling**: Indexed queries for efficient searching
- **Real-time Updates**: Snapshot listeners with connection management

**Bulk Operations**

- **Mass Deletions**: Confirmation dialogs with user count display
- **Rate Limiting**: Admin functions have built-in rate limiting
- **Audit Trail**: All admin actions logged with timestamps and context

### Data Migration Edge Cases

**Schema Evolution**

- **Version Field**: All documents have version numbers
- **Backward Compatibility**: Old document formats still readable
- **Migration Functions**: Cloud Functions for data transformations

## Regulatory and Compliance Requirements

### GDPR Compliance (EU Users)

**Right to Access**

- Admin dashboard provides complete user data visibility
- Users can request data export through admin interface

**Right to Rectification**

- Admin interface allows editing user information
- Users can update their own profile data

**Right to Erasure ("Right to be Forgotten")**

- Admin "Delete User" function removes all user data
- Cascading deletion removes goals, check-ins, and profile data
- Permanent removal with confirmation dialogs

**Right to Restrict Processing**

- "Disable User" function stops all processing while preserving data
- User can be re-enabled without data loss

**Data Portability**

- Goal data exportable in JSON format
- Standard data formats for easy migration

**Privacy by Design**

- Default privacy settings (goals not shareable by default)
- Minimal data collection (only LinkedIn profile data needed)
- Encrypted data transmission and storage

### CCPA Compliance (California Users)

**Right to Know**

- Privacy policy clearly states data collection practices
- Admin dashboard shows all collected data categories

**Right to Delete**

- Same deletion mechanism as GDPR compliance
- 30-day verification period for deletion requests

**Right to Opt-Out**

- Users can disable data sharing/analytics
- Feature flags control optional data collection

**Non-Discrimination**

- Equal service regardless of privacy choices
- Core functionality available without optional data sharing

### Security and Privacy Measures

**Data Encryption**

- All data encrypted in transit (HTTPS/TLS)
- Firebase provides encryption at rest
- LinkedIn OAuth tokens encrypted in server memory

**Access Controls**

- Role-based access control (RBAC)
- Principle of least privilege
- Regular access audits through admin dashboard

**Audit Logging**

- All admin actions logged with timestamps
- User authentication events tracked
- Data access patterns monitored

**Data Retention**

- User accounts retain data until explicit deletion
- Deleted data permanently removed within 30 days
- Audit logs retained for compliance (2 years)

### Industry-Specific Considerations

**Professional Development Context**

- No health data collection (avoids HIPAA requirements)
- No financial advice provision (avoids financial regulations)
- Educational goals supported but no formal credentials issued

**International Users**

- Multi-region Firebase deployment
- Timezone-aware date handling
- Internationalization ready (i18n structure in place)

**Accessibility Compliance**

- WCAG 2.1 AA compliance targeted
- Screen reader compatibility
- Keyboard navigation support
- Color contrast requirements met

## Business Logic Constants

```typescript
// Maximum limits
MAX_GOALS_PER_USER = 50;
MAX_CHECKINS_PER_DAY = 10;
API_TIMEOUT = 10000; // 10 seconds

// MVP Categories (fixed list)
MVP_CATEGORIES = [
  "Health & Fitness",
  "Career Development",
  "Personal Development",
  "Finance",
  "Education",
  "Skills",
  "Relationships",
  "Travel",
];

// Measurable Types
MEASURABLE_TYPES = ["Numeric", "Date", "DailyStreak", "Boolean"];

// User Roles
USER_ROLES = ["user", "admin"];

// Goal Status Values
GOAL_STATUS = ["active", "completed", "overdue"];
```

## Error Handling Patterns

### User-Facing Errors

- Clear, actionable error messages
- No technical details exposed to end users
- Graceful degradation when services unavailable

### System Errors

- Comprehensive logging to Firebase Functions logs
- Error categorization (auth, validation, system, network)
- Automatic retry mechanisms for transient failures

### Data Validation

- Client-side validation for immediate feedback
- Server-side validation for security
- Sanitization of all user inputs

This domain knowledge document serves as the single source of truth for business rules, user workflows, and compliance requirements for the LinkedGoals MVP application.
