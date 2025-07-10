// Jest setup file for dashboard testing
import "@testing-library/jest-dom";

// Mock import.meta.env for Jest compatibility
Object.defineProperty(globalThis, "import", {
  value: {
    meta: {
      env: {
        VITE_LINKEDIN_CLIENT_ID: "7880c93kzzfsgj",
        VITE_LINKEDIN_REDIRECT_URI: "https://app.linkedgoals.app/linkedin",
        VITE_FIREBASE_API_KEY: "AIzaSyD2q7PxQoZykMIih6-8fCeNhxBjPxVpBpc",
        VITE_FIREBASE_AUTH_DOMAIN: "linkedgoals-d7053.firebaseapp.com",
        VITE_FIREBASE_PROJECT_ID: "linkedgoals-d7053",
        VITE_FIREBASE_STORAGE_BUCKET: "linkedgoals-d7053.firebasestorage.app",
        VITE_FIREBASE_MESSAGING_SENDER_ID: "753801883214",
        VITE_FIREBASE_APP_ID: "1:753801883214:web:cf46567024a37452a65d1f",
        VITE_FUNCTIONS_BASE_URL: "https://us-central1-linkedgoals-d7053.cloudfunctions.net",
        VITE_ENVIRONMENT: "test",
      },
    },
  },
});

// Mock ResizeObserver for testing
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver for testing
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia for responsive testing
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock performance API
Object.defineProperty(global, "performance", {
  writable: true,
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn(),
    getEntriesByType: jest.fn(),
  },
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
});

// Custom matchers for testing
expect.extend({
  toHaveProgressValue(received, expected) {
    const progressBar = received.querySelector('[role="progressbar"]');
    const actualValue = progressBar?.getAttribute("aria-valuenow");

    const pass = actualValue === expected.toString();

    if (pass) {
      return {
        message: () => `expected progress bar not to have value ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected progress bar to have value ${expected}, but got ${actualValue}`,
        pass: false,
      };
    }
  },

  toHaveCoachingBadge(received) {
    const badge = received.querySelector(".coaching-badge");
    const pass = badge !== null;

    if (pass) {
      return {
        message: () => "expected element not to have coaching badge",
        pass: true,
      };
    } else {
      return {
        message: () => "expected element to have coaching badge",
        pass: false,
      };
    }
  },
});

// Global test utilities
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).testUtils = {
  // Helper to create mock goals
  createMockGoal: (overrides = {}) => ({
    id: "test-goal-1",
    description: "Test Goal",
    specific: "Test specific criteria",
    measurable: {
      type: "Numeric",
      targetValue: 100,
      currentValue: 50,
      unit: "units",
    },
    achievable: "Test achievable",
    relevant: "Test relevant",
    dueDate: "2024-12-31",
    createdAt: new Date(),
    status: "in-progress",
    completed: false,
    category: "Test",
    ...overrides,
  }),

  // Helper to create mock coaching notes
  createMockCoachingNote: (overrides = {}) => ({
    id: "test-note-1",
    goalId: "test-goal-1",
    coachId: "test-coach-1",
    coachName: "Test Coach",
    note: "Test coaching note",
    createdAt: new Date(),
    isRead: false,
    type: "feedback",
    ...overrides,
  }),

  // Helper to create mock progress
  createMockProgress: (overrides = {}) => ({
    goalId: "test-goal-1",
    percentage: 50,
    status: "in-progress",
    lastUpdated: new Date(),
    hasUnreadCoachNotes: false,
    coachingNotes: [],
    ...overrides,
  }),

  // Helper to wait for async operations
  waitForAsyncUpdates: () => new Promise((resolve) => setTimeout(resolve, 0)),
};

// Silence console warnings in tests unless explicitly needed
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeEach(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
  jest.clearAllMocks();
});
