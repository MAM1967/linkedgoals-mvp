# Architecture & System Design

This document provides a high-level overview of the system architecture, data flow, and design decisions for LinkedGoals MVP.

## High-level System Architecture

LinkedGoals is a modern web application built with React and Firebase, focusing on goal management with LinkedIn integration and administrative capabilities.

```mermaid
graph TB
    %% Frontend Layer
    subgraph "Frontend Layer"
        UI[React Frontend<br/>TypeScript + Vite]
        Router[React Router<br/>Client-side Routing]
        Auth[useAuth Hook<br/>Authentication State]
    end

    %% Backend Services Layer
    subgraph "Backend Services"
        CF[Cloud Functions<br/>Node.js/TypeScript]
        LinkedInAPI[LinkedIn OAuth API<br/>OpenID Connect]
    end

    %% Data Layer
    subgraph "Data Layer"
        FS[Cloud Firestore<br/>NoSQL Database]
        AuthService[Firebase Auth<br/>User Management]
        Hosting[Firebase Hosting<br/>Static Site Hosting]
    end

    %% External Services
    subgraph "External Services"
        LinkedIn[LinkedIn API<br/>Profile & OAuth]
        CDN[Firebase CDN<br/>Global Distribution]
    end

    %% User flows
    User[End Users] --> UI
    Admin[Admin Users] --> UI

    %% Frontend connections
    UI --> Router
    UI --> Auth
    Auth --> AuthService

    %% Backend connections
    UI --> CF
    CF --> LinkedInAPI
    CF --> FS
    CF --> AuthService

    %% External connections
    LinkedInAPI --> LinkedIn
    UI --> LinkedIn
    Hosting --> CDN

    %% Data flow
    AuthService --> FS
    UI --> FS
```

### Architecture Principles

- **Serverless-first**: Leveraging Firebase's serverless infrastructure for scalability
- **Security by design**: Role-based access control with Firebase Auth and Firestore rules
- **Real-time capabilities**: Firestore's real-time updates for collaborative features
- **Type safety**: Full TypeScript implementation across frontend and backend
- **Mobile-responsive**: Progressive web app capabilities

## Data Flow Diagrams

### User Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant CF as Cloud Functions
    participant LI as LinkedIn API
    participant FA as Firebase Auth
    participant FS as Firestore

    U->>FE: Click "Login with LinkedIn"
    FE->>LI: Redirect to LinkedIn OAuth
    LI->>U: Login & Authorize
    LI->>FE: Return with auth code
    FE->>CF: Send auth code to linkedinlogin()
    CF->>LI: Exchange code for access token
    LI->>CF: Return access token
    CF->>LI: Get user profile (OpenID Connect)
    LI->>CF: Return user info
    CF->>FA: Create/update Firebase user
    FA->>CF: Return user record
    CF->>FA: Create custom token
    FA->>CF: Return custom token
    CF->>FE: Return custom token + user data
    FE->>FA: Sign in with custom token
    FA->>FE: Return authenticated user
    FE->>FS: Fetch user data & goals
    FS->>FE: Return user data
```

### Goal Management Data Flow

```mermaid
flowchart TD
    A[User Creates Goal] --> B[GoalInputPage Component]
    B --> C[Validate Goal Data]
    C --> D[Save to Firestore]
    D --> E[users/{userId}/goals/{goalId}]

    F[User Views Dashboard] --> G[Dashboard Component]
    G --> H[Query User Goals]
    H --> I[Real-time Firestore Listener]
    I --> J[Update UI with Goals]

    K[Admin Management] --> L[AdminDashboard]
    L --> M[Query All Goals<br/>Collection Group Query]
    M --> N[Display in Admin Interface]

    O[Goal Sharing] --> P[SocialSharePage]
    P --> Q[Generate Share URL]
    Q --> R[SharedGoalView Component]
```

## Database Schema

### Firestore Collections Structure

```mermaid
erDiagram
    USERS {
        string uid PK "Firebase Auth UID"
        string email
        string displayName
        string photoURL
        string role "user|admin"
        timestamp createdAt
        timestamp updatedAt
        object linkedinProfile
    }

    GOALS {
        string id PK "Auto-generated"
        string userId FK "References users.uid"
        string title
        string description
        string category
        string priority "high|medium|low"
        timestamp deadline
        boolean isCompleted
        timestamp createdAt
        timestamp updatedAt
        array tags
        object smartGoalData
    }

    CHECKINS {
        string id PK "Auto-generated"
        string userId FK "References users.uid"
        string goalId FK "References goals.id"
        string content
        number progressPercentage
        timestamp createdAt
        array attachments
    }

    USERS ||--o{ GOALS : creates
    GOALS ||--o{ CHECKINS : tracks
    USERS ||--o{ CHECKINS : makes
```

### Key Database Design Decisions

- **User-centric data model**: Goals are subcollections under users for natural security boundaries
- **Collection group queries**: Admin dashboard uses collection group queries to access all goals
- **Denormalized data**: User information is duplicated in goals for efficient querying
- **Composite indexes**: Custom indexes for complex queries (userId + createdAt for checkins)

## API Architecture

### RESTful Cloud Functions

```mermaid
graph LR
    subgraph "Cloud Functions API"
        A[linkedinlogin<br/>POST /linkedinlogin]
        B[manageUser<br/>Callable Function]
        C[saveSmartGoal<br/>Callable Function]
    end

    subgraph "Authentication Flow"
        A --> D[OAuth Code Exchange]
        A --> E[User Creation/Update]
        A --> F[Custom Token Generation]
    end

    subgraph "Admin Operations"
        B --> G[User Management]
        B --> H[Role-based Access Control]
    end

    subgraph "Goal Processing"
        C --> I[SMART Goal Validation]
        C --> J[Goal Data Enhancement]
    end
```

### Authentication Flow

- **OAuth 2.0 + OpenID Connect**: LinkedIn integration using industry standards
- **Custom Firebase tokens**: Seamless integration with Firebase Auth
- **Role-based access**: Admin role checking for privileged operations

### API Endpoints

1. **`linkedinlogin` (HTTP Function)**

   - Method: POST
   - Purpose: Handle LinkedIn OAuth callback and user authentication
   - Security: CORS-enabled for app.linkedgoals.app

2. **`manageUser` (Callable Function)**

   - Purpose: Admin user management (enable/disable accounts)
   - Security: Admin role verification required

3. **`saveSmartGoal` (Callable Function)**
   - Purpose: Enhanced goal creation with SMART framework validation
   - Security: Authenticated users only

## Third-party Integrations

### LinkedIn Integration

- **Purpose**: User authentication and profile data
- **Implementation**: OAuth 2.0 with OpenID Connect
- **Scope**: `openid`, `profile`, `email`
- **Security**: Client secret managed via Firebase Functions secrets

### Firebase Services

- **Authentication**: User management and security
- **Firestore**: Real-time NoSQL database
- **Functions**: Serverless backend logic
- **Hosting**: Static site hosting with CDN
- **Security Rules**: Database-level access control

## Security Architecture

### Multi-layered Security Model

```mermaid
graph TB
    subgraph "Security Layers"
        A[Frontend Route Guards]
        B[Firebase Auth Tokens]
        C[Firestore Security Rules]
        D[Cloud Functions RBAC]
        E[Environment Secrets]
    end

    A --> B
    B --> C
    C --> D
    D --> E

    subgraph "Access Control"
        F[Public Routes]
        G[Authenticated Routes]
        H[Admin Routes]
    end

    F --> A
    G --> A
    H --> A
```

### Security Features

- **Route-based protection**: AdminProtectedRoute component for admin-only pages
- **Token-based authentication**: Firebase custom tokens with automatic refresh
- **Database security rules**: Firestore rules enforce user-level and admin-level access
- **Secret management**: LinkedIn client secret managed via Firebase Functions parameters
- **CORS protection**: Strict CORS policy for Cloud Functions

## System Boundaries and Communication

### Frontend Architecture

```mermaid
graph TB
    subgraph "React Frontend"
        A[App.tsx<br/>Main Router]
        B[AuthenticatedLayout<br/>Layout Component]
        C[useAuth Hook<br/>Auth State Management]
    end

    subgraph "Core Components"
        D[Dashboard<br/>Goal Overview]
        E[GoalInputPage<br/>Goal Creation]
        F[SocialSharePage<br/>Goal Sharing]
        G[AdminDashboard<br/>Admin Panel]
    end

    subgraph "Authentication"
        H[LinkedInLogin<br/>OAuth Initiation]
        I[LinkedInCallback<br/>OAuth Handling]
        J[AdminLogin<br/>Admin Access]
    end

    A --> B
    A --> C
    B --> D
    B --> E
    B --> F
    A --> G
    A --> H
    A --> I
    A --> J
```

### Communication Patterns

- **Real-time updates**: Firestore listeners for live data synchronization
- **Optimistic updates**: Frontend updates UI immediately, syncs with backend
- **Error boundaries**: Comprehensive error handling and user feedback
- **Loading states**: Progressive loading with skeleton screens

## Performance and Scalability

### Caching Strategy

- **Browser caching**: Static assets cached via Firebase Hosting CDN
- **Firestore offline**: Built-in offline support with automatic sync
- **Component memoization**: React.memo and useMemo for expensive computations
- **Bundle splitting**: Vite-based code splitting for optimal loading

### Scalability Considerations

- **Serverless functions**: Auto-scaling Cloud Functions
- **NoSQL database**: Horizontal scaling capabilities of Firestore
- **CDN distribution**: Global content delivery via Firebase Hosting
- **Efficient queries**: Optimized Firestore queries with proper indexing
