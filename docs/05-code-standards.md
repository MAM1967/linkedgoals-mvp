# Code Patterns & Standards

This document describes the code patterns, standards, and conventions used throughout the LinkedGoals MVP codebase.

## Code Formatting & Style

### Prettier Configuration

The project uses Prettier for consistent code formatting with these settings:

```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

### Key Formatting Rules

- **Semicolons**: Required at the end of statements
- **Quotes**: Double quotes for strings (`"hello"` not `'hello'`)
- **Indentation**: 2 spaces (no tabs)
- **Trailing commas**: ES5 style (in objects and arrays)
- **Line length**: 80 characters (soft limit, 100 hard limit)

### ESLint Configuration

```typescript
// eslint.config.js - Key rules enforced
export default tseslint.config({
  extends: [js.configs.recommended, ...tseslint.configs.recommended],
  rules: {
    ...reactHooks.configs.recommended.rules,
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
  },
});
```

## TypeScript Standards

### Type Safety Requirements

- **Strict mode enabled**: All strict TypeScript checks enforced
- **No `any` types**: Use proper typing or `unknown` for dynamic content
- **Interface over types**: Prefer interfaces for object shapes
- **Explicit return types**: Required for functions (when not obvious)

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Naming Conventions

```typescript
// Interfaces: PascalCase with descriptive names
interface UserProfile {
  uid: string;
  displayName: string;
  isAdmin?: boolean;
}

// Types: PascalCase
type AuthStatus = "loading" | "authenticated" | "unauthenticated";

// Enums: PascalCase
enum Priority {
  High = "high",
  Medium = "medium",
  Low = "low",
}

// Constants: SCREAMING_SNAKE_CASE
const API_BASE_URL = "https://api.linkedgoals.app";

// Functions and variables: camelCase
const getUserGoals = (userId: string) => { ... };
```

## Error Handling Patterns

### Frontend Error Handling

#### **Async/Await Pattern**

```typescript
// Preferred pattern for async operations
const fetchUserData = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      console.warn(`User ${userId} not found`);
      return null;
    }
    return userDoc.data() as User;
  } catch (error) {
    console.error("Failed to fetch user data:", error);
    throw new Error(`Unable to load user profile: ${error.message}`);
  }
};
```

#### **Error Boundaries for React Components**

```typescript
// Error boundary component for graceful error handling
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error boundary caught an error:", error, errorInfo);
  }
}
```

#### **Form Validation Errors**

```typescript
// Standardized error handling for forms
interface FormErrors {
  [key: string]: string | undefined;
}

const validateGoalForm = (data: GoalFormData): FormErrors => {
  const errors: FormErrors = {};

  if (!data.title?.trim()) {
    errors.title = "Goal title is required";
  }

  if (data.title && data.title.length > 100) {
    errors.title = "Goal title must be less than 100 characters";
  }

  return errors;
};
```

### Backend Error Handling (Cloud Functions)

#### **HTTP Function Error Pattern**

```typescript
export const apiFunction = onRequest(async (req, res) => {
  try {
    // Function logic
    const result = await performOperation();
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    logger.error("Function failed:", error);

    if (error.code === "permission-denied") {
      res.status(403).json({ error: "Insufficient permissions" });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});
```

#### **Callable Function Error Pattern**

```typescript
export const callableFunction = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }

  try {
    return await performOperation(request.data);
  } catch (error: any) {
    logger.error("Callable function error:", error);
    throw new HttpsError("internal", "Operation failed");
  }
});
```

## Logging Standards and Levels

### Frontend Logging

#### **Console Logging Levels**

```typescript
// Development logging
console.log("Debug info:", data); // Development only
console.info("User action:", action); // Important user actions
console.warn("Deprecated API used:", api); // Warnings
console.error("Operation failed:", error); // Errors

// Conditional logging for development
const isDev = import.meta.env.MODE === "development";
if (isDev) {
  console.log("Debug info:", debugData);
}
```

#### **User-Facing Messages**

```typescript
// Toast notifications for user feedback
const showToast = (message: string, type: "success" | "error" | "info") => {
  // Implementation would use a toast library
};

// Usage examples
showToast("Goal created successfully!", "success");
showToast("Failed to save goal. Please try again.", "error");
```

### Backend Logging (Cloud Functions)

#### **Firebase Functions Logger**

```typescript
import * as logger from "firebase-functions/logger";

// Structured logging with Firebase Functions
logger.info("User logged in", {
  uid: user.uid,
  email: user.email,
  timestamp: new Date().toISOString(),
});

logger.warn("Deprecated API endpoint used", {
  endpoint: "/api/old-endpoint",
  userAgent: req.headers["user-agent"],
});

logger.error("Database operation failed", {
  operation: "createGoal",
  userId: request.auth?.uid,
  error: error.message,
});
```

## State Management Patterns

### React Hooks for State Management

#### **useAuth Hook Pattern**

```typescript
// Custom hook for authentication state
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Enhance user with role information
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};
        setUser({ ...currentUser, ...userData });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}
```

#### **Local Component State**

```typescript
// Simple state for component-level data
const Dashboard: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use useCallback for stable function references
  const refreshGoals = useCallback(async () => {
    try {
      setLoading(true);
      const userGoals = await fetchUserGoals(user.uid);
      setGoals(userGoals);
      setError(null);
    } catch (err) {
      setError("Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, [user.uid]);

  return (
    // JSX implementation
  );
};
```

#### **Global State Pattern (Context API)**

```typescript
// Context for app-wide state
interface AppContextType {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};
```

## Form Validation Approaches

### Client-Side Validation

#### **Real-time Validation Pattern**

```typescript
interface GoalFormData {
  title: string;
  description: string;
  deadline: string;
  priority: Priority;
}

const GoalForm: React.FC = () => {
  const [formData, setFormData] = useState<GoalFormData>({
    title: "",
    description: "",
    deadline: "",
    priority: Priority.Medium,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validate on blur
  const handleBlur = (field: keyof GoalFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const fieldErrors = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: fieldErrors }));
  };

  // Validate on submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateGoalForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    await submitGoal(formData);
  };
};
```

#### **Validation Rules**

```typescript
const validation = {
  required: (value: string) =>
    !value?.trim() ? "This field is required" : undefined,

  minLength: (min: number) => (value: string) =>
    value.length < min ? `Must be at least ${min} characters` : undefined,

  maxLength: (max: number) => (value: string) =>
    value.length > max ? `Must be less than ${max} characters` : undefined,

  email: (value: string) =>
    !/\S+@\S+\.\S+/.test(value) ? "Please enter a valid email" : undefined,

  futureDate: (value: string) => {
    const date = new Date(value);
    return date <= new Date() ? "Date must be in the future" : undefined;
  },
};
```

## Authentication/Authorization Implementation

### Frontend Authentication

#### **Route Protection**

```typescript
// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Admin-only route protection
const AdminProtectedRoute: React.FC = () => {
  const { user } = useAuth();

  if (!user?.isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
```

#### **Permission Checks**

```typescript
// Hook for checking user permissions
export const usePermissions = () => {
  const { user } = useAuth();

  return {
    canCreateGoal: !!user,
    canEditGoal: (goal: Goal) => user?.uid === goal.userId || user?.isAdmin,
    canDeleteGoal: (goal: Goal) => user?.uid === goal.userId || user?.isAdmin,
    canAccessAdmin: user?.isAdmin === true,
  };
};

// Usage in components
const GoalCard: React.FC<{ goal: Goal }> = ({ goal }) => {
  const { canEditGoal, canDeleteGoal } = usePermissions();

  return (
    <div>
      {/* Goal content */}
      {canEditGoal(goal) && <EditButton />}
      {canDeleteGoal(goal) && <DeleteButton />}
    </div>
  );
};
```

### Backend Authorization

#### **Role-Based Access Control**

```typescript
// Helper function for admin check
const isAdmin = async (uid: string): Promise<boolean> => {
  const userDoc = await admin.firestore().collection("users").doc(uid).get();
  return userDoc.exists && userDoc.data()?.role === "admin";
};

// Middleware pattern for Cloud Functions
export const requireAuth = (handler: Function) => {
  return async (request: any) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Authentication required");
    }
    return handler(request);
  };
};

export const requireAdmin = (handler: Function) => {
  return requireAuth(async (request: any) => {
    const isUserAdmin = await isAdmin(request.auth.uid);
    if (!isUserAdmin) {
      throw new HttpsError("permission-denied", "Admin access required");
    }
    return handler(request);
  });
};
```

## Testing Patterns and Conventions

### Unit Testing with Jest

#### **Component Testing Pattern**

```typescript
// Component test structure
describe("Dashboard Component", () => {
  const mockUser = {
    uid: "test-uid",
    email: "test@example.com",
    displayName: "Test User",
  };

  beforeEach(() => {
    // Setup mocks
    jest.clearAllMocks();
  });

  it("should render user goals when authenticated", async () => {
    // Arrange
    const mockGoals = [{ id: "1", title: "Test Goal" }];
    (fetchUserGoals as jest.Mock).mockResolvedValue(mockGoals);

    // Act
    render(
      <AuthContext.Provider value={{ user: mockUser, loading: false }}>
        <Dashboard />
      </AuthContext.Provider>
    );

    // Assert
    await waitFor(() => {
      expect(screen.getByText("Test Goal")).toBeInTheDocument();
    });
  });

  it("should handle error states gracefully", async () => {
    // Arrange
    (fetchUserGoals as jest.Mock).mockRejectedValue(new Error("API Error"));

    // Act
    render(<Dashboard />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/error loading goals/i)).toBeInTheDocument();
    });
  });
});
```

#### **Hook Testing Pattern**

```typescript
// Custom hook testing
describe("useAuth Hook", () => {
  it("should return user when authenticated", async () => {
    // Mock Firebase auth
    const mockUser = { uid: "test-uid", email: "test@example.com" };
    (onAuthStateChanged as jest.Mock).mockImplementation((auth, callback) => {
      callback(mockUser);
      return () => {}; // unsubscribe function
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
    });
  });
});
```

### Integration Testing

#### **Firebase Emulator Testing**

```typescript
// Integration test with Firebase emulators
describe("Goal Management Integration", () => {
  beforeAll(async () => {
    // Connect to emulators
    connectFirestoreEmulator(db, "localhost", 8080);
    connectAuthEmulator(auth, "http://localhost:9099");
  });

  beforeEach(async () => {
    // Clear emulator data
    await clearFirestore();
  });

  it("should create and retrieve goals", async () => {
    const user = await createTestUser();
    const goal = await createGoal(user.uid, { title: "Test Goal" });

    const retrievedGoals = await getUserGoals(user.uid);
    expect(retrievedGoals).toHaveLength(1);
    expect(retrievedGoals[0].title).toBe("Test Goal");
  });
});
```

### Testing File Organization

```
src/
├── components/
│   ├── Dashboard.tsx
│   └── __tests__/
│       └── Dashboard.test.tsx
├── hooks/
│   ├── useAuth.ts
│   └── __tests__/
│       └── useAuth.test.ts
└── __tests__/
    ├── setup.ts
    └── integration/
        └── goalManagement.test.ts
```

### Test Naming Conventions

- **Test files**: `ComponentName.test.tsx` or `functionName.test.ts`
- **Test descriptions**: Use clear, descriptive language
- **Test structure**: Follow AAA pattern (Arrange, Act, Assert)
- **Mock naming**: Prefix with `mock` (e.g., `mockUser`, `mockFirestore`)

These standards ensure consistent, maintainable, and high-quality code across the LinkedGoals MVP project.
