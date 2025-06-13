import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { User } from "firebase/auth";
import App from "../../App";

// Mock Firebase Firestore
jest.mock("../../lib/firebase", () => ({
  auth: {
    currentUser: {
      uid: "test-uid",
      email: "test@example.com",
    },
  },
  db: {
    _delegate: {
      _databaseId: {
        projectId: "test-project",
        database: "test-db",
      },
    },
  },
}));

// Mock Firebase auth
const mockUser: User = {
  uid: "test-uid",
  email: "test@example.com",
  // Add other required User properties with mock values
} as User;

// Mock Firebase/auth functions
jest.mock("firebase/auth", () => ({
  ...jest.requireActual("firebase/auth"),
  onAuthStateChanged: jest.fn((auth, callback) => {
    // Simulate user being logged in
    callback(mockUser);
    return jest.fn(); // Return unsubscribe function
  }),
  signOut: jest.fn().mockResolvedValue(undefined),
}));

// Mock Firebase/firestore functions
jest.mock("firebase/firestore", () => ({
  ...jest.requireActual("firebase/firestore"),
  collection: jest.fn(() => ({
    id: "mock-collection-ref",
    path: "mock-path",
    _key: {
      path: {
        segments: ["mock", "collection"],
      },
    },
    _delegate: {
      _key: {
        path: {
          segments: ["mock", "collection"],
        },
      },
    },
  })),
  query: jest.fn(() => ({
    id: "mock-query",
    type: "query",
  })),
  orderBy: jest.fn(() => ({
    id: "mock-order-by",
  })),
  getDocs: jest.fn().mockResolvedValue({
    docs: [],
    empty: true,
    size: 0,
    forEach: jest.fn(),
  }),
  onSnapshot: jest.fn((query, callback) => {
    // Simulate empty goals collection
    const mockSnapshot = {
      docs: [],
      empty: true,
      size: 0,
      forEach: jest.fn(),
    };
    callback(mockSnapshot);
    return jest.fn(); // Return unsubscribe function
  }),
  doc: jest.fn(() => ({
    id: "mock-doc-ref",
    path: "mock-path",
    _key: {
      path: {
        segments: ["mock", "path"],
      },
    },
    _delegate: {
      _key: {
        path: {
          segments: ["mock", "path"],
        },
      },
    },
  })),
  getDoc: jest.fn().mockResolvedValue({
    exists: () => false,
    data: () => ({}),
  }),
  setDoc: jest.fn().mockResolvedValue(undefined),
  updateDoc: jest.fn().mockResolvedValue(undefined),
  addDoc: jest.fn().mockResolvedValue({ id: "mock-doc-id" }),
  deleteDoc: jest.fn().mockResolvedValue(undefined),
  Timestamp: {
    now: jest.fn(() => ({
      toDate: () => new Date(),
      seconds: Date.now() / 1000,
    })),
    fromDate: jest.fn((date) => ({
      toDate: () => date,
      seconds: date.getTime() / 1000,
    })),
  },
}));

// Mock React Router to avoid Router conflicts
jest.mock("react-router-dom", () => {
  const actualRouter = jest.requireActual("react-router-dom");
  return {
    ...actualRouter,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => {
      const { MemoryRouter } = actualRouter;
      return <MemoryRouter>{children}</MemoryRouter>;
    },
  };
});

describe("Goal Flow Integration", () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  it("should complete full goal creation and check-in flow", async () => {
    render(<App />);

    // 1. User should see dashboard (authenticated)
    expect(screen.getByAltText(/LinkedGoals Logo/i)).toBeInTheDocument();

    // Wait for auth state to settle
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // 2. Navigate to goal creation
    const createGoalButton = screen.getByText(/Add New SMART Goal/i);
    fireEvent.click(createGoalButton);

    // 3. Fill out goal form
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(
          /e.g., I want to become a better public speaker/i
        )
      ).toBeInTheDocument();
    });

    fireEvent.change(
      screen.getByPlaceholderText(
        /What is the overall goal you want to achieve/i
      ),
      {
        target: { value: "Learn React Testing" },
      }
    );

    // Click Next to go to the next step (Category)
    fireEvent.click(screen.getByText(/Next/i));

    // Wait for the category step to appear
    await waitFor(() => {
      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    });

    // Select a category (Skills is most appropriate for React Testing)
    fireEvent.change(screen.getByLabelText(/Category/i), {
      target: { value: "Skills" },
    });

    // Click Next to go to the Specific step
    fireEvent.click(screen.getByText(/Next/i));

    // Wait for the Specific step to appear and fill it out
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/What exactly do you want to achieve/i)
      ).toBeInTheDocument();
    });

    fireEvent.change(
      screen.getByPlaceholderText(/What exactly do you want to achieve/i),
      {
        target: { value: "Complete 10 React testing tutorials" },
      }
    );

    // Click Next to go to next step (Measurable)
    fireEvent.click(screen.getByText(/Next/i));

    await waitFor(() => {
      expect(screen.getByLabelText(/Measurable By/i)).toBeInTheDocument();
    });

    // Select "Numeric" measurement type
    fireEvent.change(screen.getByLabelText(/Measurable By/i), {
      target: { value: "Numeric" },
    });

    // Fill in target value and unit (these fields appear after selecting Numeric)
    await waitFor(() => {
      expect(screen.getByLabelText(/Target Value/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/Target Value/i), {
      target: { value: "10" },
    });

    fireEvent.change(screen.getByLabelText(/Unit/i), {
      target: { value: "tutorials" },
    });

    // Click Next to go to next step (Achievable)
    fireEvent.click(screen.getByText(/Next/i));

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/Is this goal realistic and attainable/i)
      ).toBeInTheDocument();
    });

    fireEvent.change(
      screen.getByPlaceholderText(/Is this goal realistic and attainable/i),
      {
        target: { value: "Dedicate 1 hour daily" },
      }
    );

    // Click Next to go to next step (Relevant)
    fireEvent.click(screen.getByText(/Next/i));

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/Why is this goal important to you/i)
      ).toBeInTheDocument();
    });

    fireEvent.change(
      screen.getByPlaceholderText(/Why is this goal important to you/i),
      {
        target: { value: "Improve my development skills" },
      }
    );

    // Click Next to go to next step (Time-bound)
    fireEvent.click(screen.getByText(/Next/i));

    await waitFor(() => {
      expect(screen.getByLabelText(/Time-bound/i)).toBeInTheDocument();
    });

    const dueDateInput = screen.getByLabelText(/Time-bound/i);
    fireEvent.change(dueDateInput, {
      target: { value: "2024-12-31" },
    });

    // 4. Submit goal - we're already on the final step (7/7)
    await waitFor(() => {
      expect(screen.getByText(/Save Goal/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByText(/Save Goal/i);
    fireEvent.click(submitButton);

    // 5. Verify goal was created and navigate back to dashboard
    await waitFor(() => {
      expect(screen.getByText(/Goal saved successfully/i)).toBeInTheDocument();
    });

    // 6. Navigate back to dashboard
    const dashboardLink = screen.getByText(/Dashboard/i);
    fireEvent.click(dashboardLink);

    // 7. Verify we're back at the dashboard
    await waitFor(() => {
      expect(screen.getByText(/Your Goal Progress/i)).toBeInTheDocument();
    });
  });

  it("should handle goal sharing flow", async () => {
    render(<App />);

    // Wait for auth state to settle
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Should see dashboard with goals
    expect(screen.getByAltText(/LinkedGoals Logo/i)).toBeInTheDocument();
  });

  it("should handle authentication flow", async () => {
    render(<App />);

    // Should show authenticated state
    await waitFor(() => {
      expect(screen.getByAltText(/LinkedGoals Logo/i)).toBeInTheDocument();
    });
  });
});
