import { SmartGoal, GoalProgress } from "../../types/Dashboard";

// Common mock goals for testing
export const mockGoals = {
  numeric: {
    id: "numeric-goal-id",
    description: "Complete coding tasks",
    specific: "Finish 100 coding exercises",
    measurable: {
      type: "Numeric",
      currentValue: 25,
      targetValue: 100,
      unit: "exercises",
    },
    achievable: "Dedicate 2 hours daily",
    relevant: "Improve programming skills",
    dueDate: "2024-06-30",
    createdAt: new Date(),
    status: "active",
    completed: false,
    category: "Learning",
  } as SmartGoal,

  boolean: {
    id: "boolean-goal-id",
    description: "Complete certification",
    specific: "Get AWS certification",
    measurable: {
      type: "Boolean",
      currentValue: false,
      targetValue: 1,
    },
    achievable: "Study and take exam",
    relevant: "Career advancement",
    dueDate: "2024-08-15",
    createdAt: new Date(),
    status: "active",
    completed: false,
    category: "Professional",
  } as SmartGoal,

  streak: {
    id: "streak-goal-id",
    description: "Daily exercise habit",
    specific: "Exercise for 30 days straight",
    measurable: {
      type: "DailyStreak",
      currentValue: 7,
      targetValue: 30,
      unit: "days",
    },
    achievable: "30 minutes daily",
    relevant: "Health improvement",
    dueDate: "2024-07-01",
    createdAt: new Date(),
    status: "active",
    completed: false,
    category: "Health",
  } as SmartGoal,
};

export const mockProgress: GoalProgress = {
  goalId: "test-goal-id",
  percentage: 50,
  status: "in-progress",
  lastUpdated: new Date(),
  hasUnreadCoachNotes: false,
  coachingNotes: [
    {
      id: "note-1",
      goalId: "test-goal-id",
      coachId: "coach-id",
      coachName: "Test Coach",
      note: "Great progress! Keep it up!",
      createdAt: new Date("2024-01-15"),
      isRead: false,
      type: "encouragement",
    },
  ],
};

// Test helper functions
export const setupMatchMediaMock = () => {
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
};

export const setupReducedMotionMock = () => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
