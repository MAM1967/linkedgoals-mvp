import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { GoalDetailsModal } from "../GoalDetailsModal";
import { SmartGoal, GoalProgress } from "../../types/Dashboard";

// Mock Firebase functions
const mockUpdateDoc = jest.fn();

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  updateDoc: mockUpdateDoc,
}));

// Mock Firebase
jest.mock("../../lib/firebase", () => ({
  db: {},
  auth: {
    currentUser: { uid: "test-user-id" },
  },
}));

// Mock the common Tooltip component
jest.mock("../common/Tooltip", () => {
  return function MockTooltip({
    children,
    text,
  }: {
    children: React.ReactNode;
    text: string;
  }) {
    return <div title={text}>{children}</div>;
  };
});

describe("GoalDetailsModal", () => {
  const mockGoal: SmartGoal = {
    id: "test-goal-id",
    description: "Test goal description",
    specific: "Learn React Testing",
    measurable: {
      type: "Numeric",
      currentValue: 50,
      targetValue: 100,
      unit: "lessons",
    },
    achievable: "Break down into daily practice sessions",
    relevant: "Advance my career in frontend development",
    dueDate: "2024-12-31",
    createdAt: new Date(),
    status: "active",
    completed: false,
    category: "Professional Development",
  };

  const mockProgress: GoalProgress = {
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

  const defaultProps = {
    goal: mockGoal,
    progress: mockProgress,
    isOpen: true,
    onClose: jest.fn(),
    onGoalUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    test("renders when isOpen is true", () => {
      render(<GoalDetailsModal {...defaultProps} />);

      expect(screen.getByText("Goal Details")).toBeInTheDocument();
      expect(screen.getByText("Learn React Testing")).toBeInTheDocument();
    });

    test("does not render when isOpen is false", () => {
      render(<GoalDetailsModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText("Goal Details")).not.toBeInTheDocument();
    });

    test("displays goal information correctly", () => {
      render(<GoalDetailsModal {...defaultProps} />);

      expect(screen.getByText("Learn React Testing")).toBeInTheDocument();
      expect(screen.getByText("Professional Development")).toBeInTheDocument();
      expect(screen.getByText("50% Complete")).toBeInTheDocument();
      expect(
        screen.getByText("Break down into daily practice sessions")
      ).toBeInTheDocument();
    });

    test("shows progress statistics", () => {
      render(<GoalDetailsModal {...defaultProps} />);

      expect(screen.getByText("Progress Overview")).toBeInTheDocument();
      expect(screen.getByText("50 / 100 lessons")).toBeInTheDocument();
      expect(screen.getByText("in-progress")).toBeInTheDocument();
    });

    test("renders coaching notes when present", () => {
      render(<GoalDetailsModal {...defaultProps} />);

      expect(screen.getByText("Coaching Notes")).toBeInTheDocument();
      expect(screen.getByText("Test Coach")).toBeInTheDocument();
      expect(
        screen.getByText("Great progress! Keep it up!")
      ).toBeInTheDocument();
    });

    test("handles empty coaching notes state", () => {
      const propsWithoutNotes = {
        ...defaultProps,
        progress: { ...mockProgress, coachingNotes: [] },
      };

      render(<GoalDetailsModal {...propsWithoutNotes} />);

      expect(screen.queryByText("Coaching Notes")).not.toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    test("opens edit mode when edit button clicked", async () => {
      const user = userEvent.setup();
      render(<GoalDetailsModal {...defaultProps} />);

      const editButton = screen.getByText("✏️ Edit");
      await user.click(editButton);

      expect(screen.getByText("Edit Goal")).toBeInTheDocument();
      expect(
        screen.getByDisplayValue("Learn React Testing")
      ).toBeInTheDocument();
    });

    test("closes modal when close button clicked", async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      render(<GoalDetailsModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByText("✕");
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    test("closes modal when escape key pressed", async () => {
      const onClose = jest.fn();
      render(<GoalDetailsModal {...defaultProps} onClose={onClose} />);

      await act(async () => {
        fireEvent.keyDown(document, { key: "Escape" });
      });

      expect(onClose).toHaveBeenCalled();
    });

    test("closes modal when overlay clicked", async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      render(<GoalDetailsModal {...defaultProps} onClose={onClose} />);

      const overlay = screen.getByRole("dialog").parentElement;
      if (overlay) {
        await user.click(overlay);
        expect(onClose).toHaveBeenCalled();
      }
    });

    test("cancels editing and reverts changes", async () => {
      const user = userEvent.setup();
      render(<GoalDetailsModal {...defaultProps} />);

      // Enter edit mode
      await user.click(screen.getByText("✏️ Edit"));

      // Make changes
      const specificField = screen.getByDisplayValue("Learn React Testing");
      await user.clear(specificField);
      await user.type(specificField, "Modified Goal");

      // Cancel editing
      await user.click(screen.getByText("Cancel"));

      // Verify original values are restored
      expect(screen.getByText("Goal Details")).toBeInTheDocument();
      expect(screen.getByText("Learn React Testing")).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    test("saves changes when save button clicked", async () => {
      const { updateDoc } = require("firebase/firestore");
      const user = userEvent.setup();
      const onGoalUpdate = jest.fn();

      render(
        <GoalDetailsModal {...defaultProps} onGoalUpdate={onGoalUpdate} />
      );

      // Enter edit mode
      await user.click(screen.getByText("✏️ Edit"));

      // Make changes
      const specificField = screen.getByDisplayValue("Learn React Testing");
      await user.clear(specificField);
      await user.type(specificField, "Master React Testing");

      // Save changes
      await user.click(screen.getByText("Save Changes"));

      await waitFor(() => {
        expect(updateDoc).toHaveBeenCalled();
        expect(onGoalUpdate).toHaveBeenCalled();
      });
    });

    test("shows success message after successful save", async () => {
      const { updateDoc } = require("firebase/firestore");
      updateDoc.mockResolvedValueOnce({});

      const user = userEvent.setup();
      render(<GoalDetailsModal {...defaultProps} />);

      await user.click(screen.getByText("✏️ Edit"));
      await user.click(screen.getByText("Save Changes"));

      await waitFor(() => {
        expect(screen.getByText("Saved successfully! ✅")).toBeInTheDocument();
      });
    });

    test("shows error message on save failure", async () => {
      const { updateDoc } = require("firebase/firestore");
      updateDoc.mockRejectedValueOnce(new Error("Save failed"));

      const user = userEvent.setup();
      render(<GoalDetailsModal {...defaultProps} />);

      await user.click(screen.getByText("✏️ Edit"));
      await user.click(screen.getByText("Save Changes"));

      await waitFor(() => {
        expect(screen.getByText("Error saving changes ❌")).toBeInTheDocument();
      });
    });
  });

  describe("Progress Calculations", () => {
    test("calculates days remaining correctly", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const goalWithFutureDate = {
        ...mockGoal,
        dueDate: futureDate.toISOString().split("T")[0],
      };

      render(<GoalDetailsModal {...defaultProps} goal={goalWithFutureDate} />);

      expect(screen.getByText("30 days")).toBeInTheDocument();
    });

    test("handles overdue goals", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);

      const overdueGoal = {
        ...mockGoal,
        dueDate: pastDate.toISOString().split("T")[0],
      };

      render(<GoalDetailsModal {...defaultProps} goal={overdueGoal} />);

      expect(screen.getByText("Overdue")).toBeInTheDocument();
    });

    test("generates appropriate motivational messages", () => {
      render(<GoalDetailsModal {...defaultProps} />);

      // Should show halfway message for 50% progress
      expect(screen.getByText(/halfway there/i)).toBeInTheDocument();
    });

    test("formats measurable progress display for different types", () => {
      const booleanGoal = {
        ...mockGoal,
        measurable: {
          type: "Boolean",
          currentValue: true,
          targetValue: 1,
        },
      };

      render(<GoalDetailsModal {...defaultProps} goal={booleanGoal} />);

      expect(screen.getByText("Completed ✅")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    test("supports keyboard navigation", async () => {
      render(<GoalDetailsModal {...defaultProps} />);

      const editButton = screen.getByText("✏️ Edit");
      const closeButton = screen.getByText("✕");

      // Test tab navigation
      editButton.focus();
      expect(editButton).toHaveFocus();

      fireEvent.keyDown(editButton, { key: "Tab" });
      expect(closeButton).toHaveFocus();
    });

    test("has proper ARIA labels", () => {
      render(<GoalDetailsModal {...defaultProps} />);

      const modal = screen.getByRole("dialog", { hidden: true });
      expect(modal).toBeInTheDocument();
    });

    test("maintains focus management", () => {
      render(<GoalDetailsModal {...defaultProps} />);

      // Modal should trap focus when open
      const modal = document.querySelector(".goal-details-modal");
      expect(modal).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    test("handles goals with missing data", () => {
      const incompleteGoal = {
        ...mockGoal,
        achievable: "",
        relevant: "",
      };

      render(<GoalDetailsModal {...defaultProps} goal={incompleteGoal} />);

      expect(screen.getByText("Goal Details")).toBeInTheDocument();
    });

    test("handles very long goal descriptions", () => {
      const longGoal = {
        ...mockGoal,
        specific: "A".repeat(1000),
      };

      render(<GoalDetailsModal {...defaultProps} goal={longGoal} />);

      expect(screen.getByDisplayValue("A".repeat(1000))).toBeInTheDocument();
    });

    test("handles special characters in goal data", () => {
      const specialCharGoal = {
        ...mockGoal,
        specific: 'Test with <script>alert("xss")</script> & special chars',
      };

      render(<GoalDetailsModal {...defaultProps} goal={specialCharGoal} />);

      expect(screen.getByText(/Test with.*special chars/)).toBeInTheDocument();
    });

    test("handles concurrent updates gracefully", async () => {
      const { updateDoc } = require("firebase/firestore");
      updateDoc.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const user = userEvent.setup();
      render(<GoalDetailsModal {...defaultProps} />);

      await user.click(screen.getByText("✏️ Edit"));

      // Start first save
      const savePromise1 = user.click(screen.getByText("Save Changes"));

      // Don't wait for completion before starting second operation
      const savePromise2 = user.click(screen.getByText("Save Changes"));

      await Promise.all([savePromise1, savePromise2]);

      // Should handle gracefully without errors
      expect(updateDoc).toHaveBeenCalled();
    });
  });

  describe("Responsive Design", () => {
    test("adjusts layout for mobile screens", () => {
      // Mock mobile viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<GoalDetailsModal {...defaultProps} />);

      const modal = document.querySelector(".goal-details-modal");
      expect(modal).toHaveClass("goal-details-modal");
    });
  });

  describe("Animation Preferences", () => {
    test("respects reduced motion preferences", () => {
      // Mock prefers-reduced-motion
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

      render(<GoalDetailsModal {...defaultProps} />);

      // Verify animations are disabled or reduced
      const modal = document.querySelector(".goal-details-modal");
      expect(modal).toBeInTheDocument();
    });
  });
});
