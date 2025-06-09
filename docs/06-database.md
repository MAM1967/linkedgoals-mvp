# Database & Data Management

This document covers the Firestore database schema, security model, and data management practices for LinkedGoals MVP.

## Database Technology

**Firebase Firestore** - A flexible, scalable NoSQL cloud database with:

- Real-time synchronization
- Offline support
- Strong consistency
- ACID transactions
- Automatic multi-region replication

## Database Schema

### Collections Structure

```mermaid
graph TB
    subgraph "Firestore Database"
        A[users/]
        B[users/{userId}/goals/]
        C[users/{userId}/checkins/]
        D[sharedGoals/]
        E[admin/]
    end

    A --> B
    A --> C
    A --> D

    subgraph "Collection Group Queries"
        F[goals collection group]
        G[checkins collection group]
    end

    B --> F
    C --> G
```

### Collection Details

#### `users/` Collection

```typescript
interface User {
  uid: string; // Firebase Auth UID (document ID)
  email: string; // User email from LinkedIn
  displayName: string; // Full name
  photoURL?: string; // Profile picture URL
  role: "user" | "admin"; // User role for authorization
  createdAt: Timestamp; // Account creation time
  updatedAt: Timestamp; // Last profile update
  linkedinProfile: {
    // LinkedIn profile data
    sub: string; // LinkedIn ID
    given_name: string;
    family_name: string;
    email_verified: boolean;
  };
  preferences?: {
    // User preferences
    notifications: boolean;
    privacy: "public" | "private";
  };
}
```

#### `users/{userId}/goals/` Subcollection

```typescript
interface Goal {
  id: string; // Auto-generated document ID
  userId: string; // Reference to parent user
  title: string; // Goal title
  description: string; // Detailed description
  category: string; // Goal category/type
  priority: "high" | "medium" | "low";
  deadline: Timestamp; // Target completion date
  isCompleted: boolean; // Completion status
  createdAt: Timestamp; // Creation timestamp
  updatedAt: Timestamp; // Last modification
  tags: string[]; // Searchable tags
  smartGoalData?: {
    // SMART framework data
    specific: string;
    measurable: string;
    achievable: string;
    relevant: string;
    timeBound: string;
  };
  shareSettings?: {
    // Sharing configuration
    isPublic: boolean;
    shareUrl?: string;
  };
}
```

#### `users/{userId}/checkins/` Subcollection

```typescript
interface Checkin {
  id: string; // Auto-generated document ID
  userId: string; // Reference to user
  goalId: string; // Reference to goal
  content: string; // Check-in description
  progressPercentage: number; // Progress 0-100
  createdAt: Timestamp; // Check-in timestamp
  attachments?: string[]; // File URLs (if any)
  mood?: "positive" | "neutral" | "challenging";
}
```

## Security Rules

The Firestore security rules implement a role-based access control system:

```javascript
// User document access
match /users/{userId} {
  // Users can read/write their own data, admins can access any
  allow read, write: if request.auth != null &&
    (request.auth.uid == userId || isAdmin());

  // Subcollections inherit parent permissions
  match /{document=**} {
    allow read, write: if request.auth != null &&
      (request.auth.uid == userId || isAdmin());
  }
}

// Admin access to collection group queries
match /{path=**}/goals/{goalId} {
  allow read: if request.auth != null && isAdmin();
}
```

### Security Principles

- **User isolation**: Users can only access their own data
- **Admin oversight**: Admins can access all data for management
- **Authentication required**: No anonymous access allowed
- **Role-based authorization**: Admin role checked via Firestore lookup

## Indexing Strategy

### Existing Indexes (firestore.indexes.json)

```json
{
  "indexes": [
    {
      "collectionGroup": "checkins",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

### Index Usage Patterns

- **User checkins**: Query checkins by user ordered by creation date
- **Goal queries**: Use collection group queries for admin dashboard
- **Time-based queries**: Support for date range filtering

### Performance Considerations

- **Composite indexes**: Created for complex queries combining multiple fields
- **Collection group indexes**: Enable cross-user queries for admin features
- **Sort optimization**: Indexes support efficient ordering by timestamp
- **Pagination**: Implemented using Firestore cursors for large datasets

## Data Migration Strategy

### Schema Evolution

Since Firestore is schemaless, migrations are handled through:

1. **Additive changes**: New fields can be added without migration
2. **Field transformations**: Cloud Functions process existing documents
3. **Version tracking**: Document-level version fields for gradual migration
4. **Backward compatibility**: Old and new schemas coexist during transition

### Migration Process

```typescript
// Example migration function
export const migrateUserProfiles = onCall(async (request) => {
  // Check admin permissions
  if (!isAdmin(request.auth.uid)) {
    throw new HttpsError("permission-denied", "Admin access required");
  }

  const batch = db.batch();
  const usersRef = collection(db, "users");
  const snapshot = await getDocs(usersRef);

  snapshot.docs.forEach((doc) => {
    if (!doc.data().version || doc.data().version < 2) {
      batch.update(doc.ref, {
        version: 2,
        preferences: {
          notifications: true,
          privacy: "private",
        },
      });
    }
  });

  await batch.commit();
});
```

## Development Data Seeding

### Test Data Generation

Development environments use seeded data for consistent testing:

```typescript
// Seed function for development
export const seedTestData = async () => {
  const testUsers = [
    {
      uid: "test-user-1",
      email: "john@example.com",
      displayName: "John Doe",
      role: "user",
      createdAt: Timestamp.now(),
    },
    {
      uid: "test-admin-1",
      email: "admin@linkedgoals.app",
      displayName: "Admin User",
      role: "admin",
      createdAt: Timestamp.now(),
    },
  ];

  for (const user of testUsers) {
    await setDoc(doc(db, "users", user.uid), user);

    // Seed goals for each user
    await seedGoalsForUser(user.uid);
  }
};
```

### Seeding Scripts

- **Development setup**: Automated seeding during development setup
- **Test isolation**: Each test suite gets fresh data
- **Realistic data**: Seeded data mirrors production patterns

## Backup and Restore Procedures

### Automated Backups

Firebase provides automatic daily backups with:

- **Point-in-time recovery**: Restore to any point within retention period
- **Export functionality**: Full database exports to Cloud Storage
- **Cross-region replication**: Automatic disaster recovery

### Backup Strategy

1. **Daily automated backups**: Managed by Firebase
2. **Pre-deployment exports**: Manual exports before major releases
3. **Development snapshots**: Local emulator data for testing

### Restore Process

```bash
# Export current database
gcloud firestore export gs://linkedgoals-backups/$(date +%Y%m%d)

# Import from backup
gcloud firestore import gs://linkedgoals-backups/20241201
```

## Data Validation Rules

### Client-side Validation

React components implement form validation:

- **Required fields**: Title, description for goals
- **Format validation**: Email, date formats
- **Length limits**: Text field character limits
- **Type checking**: TypeScript ensures type safety

### Server-side Validation

Firestore security rules enforce data integrity:

```javascript
// Goal validation rules
match /users/{userId}/goals/{goalId} {
  allow write: if request.auth != null &&
    request.auth.uid == userId &&
    validateGoal(request.resource.data);
}

function validateGoal(data) {
  return data.title is string &&
         data.title.size() > 0 &&
         data.title.size() <= 100 &&
         data.priority in ['high', 'medium', 'low'];
}
```

### Data Constraints

- **String lengths**: Enforced at both client and database level
- **Enum validation**: Priority levels, user roles validated
- **Required fields**: Core fields must be present
- **Type safety**: TypeScript interfaces ensure consistent structure

## Query Patterns and Optimization

### Common Query Patterns

```typescript
// User's goals ordered by deadline
const getUserGoals = (userId: string) => {
  return query(
    collection(db, `users/${userId}/goals`),
    orderBy("deadline", "asc"),
    where("isCompleted", "==", false)
  );
};

// Admin dashboard - all goals
const getAllGoals = () => {
  return query(
    collectionGroup(db, "goals"),
    orderBy("createdAt", "desc"),
    limit(50)
  );
};

// Recent checkins for a goal
const getRecentCheckins = (userId: string, goalId: string) => {
  return query(
    collection(db, `users/${userId}/checkins`),
    where("goalId", "==", goalId),
    orderBy("createdAt", "desc"),
    limit(10)
  );
};
```

### Performance Optimizations

- **Pagination**: Cursor-based pagination for large result sets
- **Real-time listeners**: Efficient real-time updates for dashboard
- **Batch operations**: Bulk writes for better performance
- **Caching**: Client-side caching with offline support
