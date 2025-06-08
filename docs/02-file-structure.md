# File Structure & Organization

This document outlines the project's file structure and the conventions used for organizing code.

### Directory Structure

```
project-root/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Route-specific components
│   ├── services/      # API calls and business logic
│   ├── utils/         # Helper functions
│   ├── hooks/         # Custom React hooks
│   └── types/         # TypeScript definitions
├── tests/
├── docs/
├── config/
└── scripts/
```

_(Note: The above structure is a general example. The actual structure may vary. The current project structure has been analyzed and the following key directories have been identified: `src`, `functions`, `scripts`, `cypress`, `public`)_

### Naming conventions for files, folders, and variables

_(TODO: Document the naming conventions. For example, `PascalCase` for components, `camelCase` for variables and functions, etc. Be specific about file naming, e.g., `ComponentName.tsx`, `useCustomHook.ts`.)_

### Import path conventions and aliases

_(TODO: Document any import path aliases configured in `tsconfig.json` or other build tools. For example, `@/components/_`resolving to`src/components/_`. This helps in keeping imports clean and consistent.)_

### Where different types of code belong

_(TODO: Provide guidelines on where to place new code. For example, "New React components should go into `src/components`.", "Business logic related to a specific feature should be in `src/services`.", "Utility functions that can be shared across the application should be in `src/utils`.")_
