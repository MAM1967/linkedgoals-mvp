# File Structure & Organization

This document outlines the project's file structure and the conventions used for organizing code in the LinkedGoals MVP.

## Directory Structure

```
linkedgoals-mvp/
├── public/                    # Static assets served by Vite
├── src/                       # Frontend source code
│   ├── components/           # Reusable React components
│   │   ├── __tests__/       # Component unit tests
│   │   ├── GoalInputPage/   # Feature-specific component modules
│   │   ├── Dashboard.tsx     # Main dashboard component
│   │   ├── GoalInputPage.tsx # Goal creation interface
│   │   ├── SocialSharePage.tsx # Goal sharing functionality
│   │   ├── AdminProtectedRoute.tsx # Route protection
│   │   └── ...              # Other UI components
│   ├── pages/               # Route-specific page components
│   │   └── admin/           # Admin-specific pages
│   │       ├── AdminDashboard.tsx
│   │       ├── UserManagement.tsx
│   │       └── GoalManagement.tsx
│   ├── hooks/               # Custom React hooks
│   │   └── useAuth.ts       # Authentication state management
│   ├── lib/                 # Core libraries and configurations
│   │   ├── firebase.ts      # Firebase configuration & utils
│   │   └── firestore.ts     # Firestore helper functions
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts         # Shared types and interfaces
│   ├── assets/              # Images, icons, and static content
│   ├── __tests__/           # Global test setup and utilities
│   ├── __mocks__/           # Jest mocks for external dependencies
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   └── *.css                # Component and global styles
├── functions/               # Firebase Cloud Functions (Backend)
│   ├── src/
│   │   ├── index.ts         # Main functions entry point
│   │   └── saveSmartGoal.ts # Goal processing function
│   ├── lib/                 # Compiled JavaScript output
│   └── package.json         # Backend dependencies
├── docs/                    # Project documentation
├── cypress/                 # End-to-end tests
├── scripts/                 # Build and deployment scripts
├── dist/                    # Built frontend assets
├── .github/                 # GitHub Actions workflows
│   └── workflows/           # CI/CD pipeline definitions
├── firebase.json            # Firebase project configuration
├── firestore.rules          # Database security rules
├── firestore.indexes.json   # Database indexes configuration
├── package.json             # Frontend dependencies and scripts
└── vite.config.ts           # Build tool configuration
```

## Naming Conventions

### Files and Directories

- **Components**: `PascalCase` for React components (e.g., `Dashboard.tsx`, `GoalInputPage.tsx`)
- **Pages**: `PascalCase` in `pages/` directory for route components
- **Hooks**: `camelCase` with `use` prefix (e.g., `useAuth.ts`)
- **Utilities**: `camelCase` for utility functions and modules
- **Constants**: `SCREAMING_SNAKE_CASE` for exported constants
- **CSS Files**: Match component names (e.g., `Dashboard.css` for `Dashboard.tsx`)

### Variables and Functions

- **Variables**: `camelCase` for variables and object properties
- **Functions**: `camelCase` for regular functions
- **Components**: `PascalCase` for React component functions
- **Types/Interfaces**: `PascalCase` for TypeScript types and interfaces
- **Enums**: `PascalCase` with descriptive names

### Code Organization Patterns

```typescript
// Component file structure example (Dashboard.tsx)
import React from "react";
import { useState, useEffect } from "react";
import { collection, query, orderBy } from "firebase/firestore";

// Types and interfaces at the top
interface DashboardProps {
  user: User;
}

// Main component
const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  // Component logic
};

export default Dashboard;
```

## Import Path Conventions

### Import Order

1. React and React-related imports
2. Third-party library imports
3. Internal component imports
4. Utility and service imports
5. Type imports (with `type` keyword)
6. CSS imports (last)

### Path Conventions

- **Relative imports**: Used for nearby files (`./`, `../`)
- **Absolute imports**: From `src/` root for distant files
- **Barrel exports**: Used in directories with multiple related exports

```typescript
// Example import patterns
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { getAuth } from "firebase/auth";

import Dashboard from "./components/Dashboard";
import { useAuth } from "./hooks/useAuth";
import { db } from "./lib/firebase";
import type { User } from "./types";

import "./App.css";
```

## Where Different Types of Code Belong

### Frontend (`src/`)

- **`components/`**: Reusable UI components that can be used across multiple pages

  - Feature-specific components go in subdirectories (e.g., `GoalInputPage/`)
  - Generic components stay at the root level
  - Each component should have its own CSS file if styled

- **`pages/`**: Route-specific components that represent full page views

  - Admin pages go in `pages/admin/`
  - Each page should be a composition of smaller components

- **`hooks/`**: Custom React hooks for reusable stateful logic

  - Authentication state (`useAuth`)
  - Data fetching hooks
  - Form handling hooks

- **`lib/`**: Core libraries, configurations, and service integrations

  - Firebase configuration and utilities
  - API client configurations
  - External service integrations

- **`types/`**: TypeScript type definitions and interfaces
  - Shared types used across multiple files
  - API response interfaces
  - Component prop types

### Backend (`functions/`)

- **`src/index.ts`**: Main Cloud Functions exports
- **`src/[feature].ts`**: Feature-specific function modules
- **`lib/`**: Compiled JavaScript (auto-generated, not edited)

### Configuration Files

- **Root level**: Project-wide configuration (Vite, TypeScript, ESLint, etc.)
- **Firebase configs**: Database rules, hosting configuration, function settings
- **`.github/`**: CI/CD workflows and repository automation

### Testing

- **`__tests__/`**: Test files collocated with the code they test
- **`cypress/`**: End-to-end integration tests
- **`jest.config.cjs`**: Testing framework configuration

### Documentation

- **`docs/`**: Project documentation organized by topic
- **`README.md`**: Project overview and quick start guide
- **Inline comments**: For complex business logic and non-obvious code

This structure promotes:

- **Clear separation of concerns**
- **Easy navigation and file discovery**
- **Consistent naming across the project**
- **Scalable organization as the project grows**
