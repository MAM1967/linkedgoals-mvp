import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { NewGoalModal } from "../NewGoalModal";
import { SmartGoal, GoalProgress } from "../../types/Dashboard";

const mockGoal: SmartGoal = {
  id: "test-goal-1",
  specific: "Learn React Testing",
  description: "Master testing React components with Jest and RTL",
  measurable: {
    type: "Numeric",
    currentValue: 50,
    targetValue: 100,
    unit: "lessons",
  },
  achievable: "Break down into daily practice sessions",
  relevant: "Essential for my frontend development career",
  dueDate: "2024-12-31",
  category: "Professional Development",
  createdAt: new Date("2024-01-01"),
  status: "active",
  completed: false,
};

const mockProgress: GoalProgress = {
  goalId: "test-goal-1",
  percentage: 50,
  status: "in-progress",
  lastUpdated: new Date("2024-01-01"),
  hasUnreadCoachNotes: false,
};

describe("NewGoalModal", () => {
  const defaultProps = {
    goal: mockGoal,
    progress: mockProgress,
    isOpen: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    test("renders when isOpen is true", () => {
      render(<NewGoalModal {...defaultProps} />);

      expect(screen.getByText("Goal Details")).toBeInTheDocument();
      expect(screen.getByText("Learn React Testing")).toBeInTheDocument();
    });

    test("does not render when isOpen is false", () => {
      render(<NewGoalModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText("Goal Details")).not.toBeInTheDocument();
    });

    test("displays goal information correctly", () => {
      render(<NewGoalModal {...defaultProps} />);

      expect(screen.getByText("Goal Details")).toBeInTheDocument();
      expect(screen.getByText("50% Complete")).toBeInTheDocument();
      expect(screen.getByText("S - Specific:")).toBeInTheDocument();
      expect(screen.getByText("Learn React Testing")).toBeInTheDocument();
    });

    test("shows progress statistics", () => {
      render(<NewGoalModal {...defaultProps} />);

      expect(screen.getByText("Progress Overview")).toBeInTheDocument();
      expect(screen.getByText("50 / 100 lessons")).toBeInTheDocument();
      expect(screen.getByText("in-progress")).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    test("closes modal when close button clicked", async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      render(<NewGoalModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByText("✕");
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });
  });
});
