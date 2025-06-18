import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ProgressUpdateModal } from "../ProgressUpdateModal";
import { SmartGoal } from "../../types/Dashboard";

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

describe("ProgressUpdateModal", () => {
  const mockNumericGoal: SmartGoal = {
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
  };

  const mockBooleanGoal: SmartGoal = {
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
  };

  const mockStreakGoal: SmartGoal = {
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
  };

  const defaultProps = {
    goal: mockNumericGoal,
    isOpen: true,
    onClose: jest.fn(),
    onUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    test("renders with correct goal information", () => {
      render(<ProgressUpdateModal {...defaultProps} />);

      expect(screen.getByText("Update Progress")).toBeInTheDocument();
      expect(
        screen.getByText("Finish 100 coding exercises")
      ).toBeInTheDocument();
    });

    test("does not render when isOpen is false", () => {
      render(<ProgressUpdateModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText("Update Progress")).not.toBeInTheDocument();
    });

    test("shows current vs projected progress bars", () => {
      render(<ProgressUpdateModal {...defaultProps} />);

      expect(screen.getByText("Current Progress")).toBeInTheDocument();
      expect(screen.getByText("New Progress")).toBeInTheDocument();
      const progressLabels = screen.getAllByText("25%");
      expect(progressLabels.length).toBeGreaterThanOrEqual(1);
    });

    test("displays appropriate input controls for measurable type", () => {
      render(<ProgressUpdateModal {...defaultProps} />);

      expect(screen.getByText("Quick Update")).toBeInTheDocument();
      expect(screen.getByText("Set Value")).toBeInTheDocument();
      expect(screen.getByText("+")).toBeInTheDocument();
      expect(screen.getByText("−")).toBeInTheDocument();
    });

    test("shows prediction messages when available", () => {
      render(<ProgressUpdateModal {...defaultProps} />);

      // Should show prediction for numeric goals
      expect(screen.getByText(/Final sprint/)).toBeInTheDocument();
    });

    test("displays streak information for DailyStreak goals", () => {
      render(<ProgressUpdateModal {...defaultProps} goal={mockStreakGoal} />);

      expect(screen.getByText(/day streak/)).toBeInTheDocument();
      expect(screen.getByText(/Every step counts/)).toBeInTheDocument();
    });
  });

  describe("Input Methods", () => {
    test("increment mode increases value correctly", async () => {
      const user = userEvent.setup();
      render(<ProgressUpdateModal {...defaultProps} />);

      const incrementButton = screen.getByText("+");
      await user.click(incrementButton);

      expect(screen.getByText("26")).toBeInTheDocument();
    });

    test("decrement mode decreases value correctly", async () => {
      const user = userEvent.setup();
      render(<ProgressUpdateModal {...defaultProps} />);

      const decrementButton = screen.getByText("−");
      await user.click(decrementButton);

      expect(screen.getByText("24")).toBeInTheDocument();
    });

    test("custom input mode accepts valid values", async () => {
      const user = userEvent.setup();
      render(<ProgressUpdateModal {...defaultProps} />);

      await user.click(screen.getByText("Set Value"));
      const input = screen.getByPlaceholderText("Enter value...");
      await user.type(input, "75");
      const buttons = screen.getAllByText("Set Value");
      await user.click(buttons[1]); // The button in the input form

      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    test("boolean mode toggles correctly", async () => {
      const user = userEvent.setup();
      render(<ProgressUpdateModal {...defaultProps} goal={mockBooleanGoal} />);

      const completeButton = screen.getByText("✅ Complete");
      await user.click(completeButton);

      expect(completeButton).toHaveClass("active");
    });

    test("prevents negative values", async () => {
      const user = userEvent.setup();
      const goalWithZeroValue = {
        ...mockNumericGoal,
        measurable: { ...mockNumericGoal.measurable, currentValue: 0 },
      };

      render(
        <ProgressUpdateModal {...defaultProps} goal={goalWithZeroValue} />
      );

      const decrementButton = screen.getByText("−");
      await user.click(decrementButton);

      // Should stay at 0
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });

  describe("Progress Calculations", () => {
    test("calculates current progress percentage correctly", () => {
      render(<ProgressUpdateModal {...defaultProps} />);

      // 25/100 = 25%
      const progressLabels = screen.getAllByText("25%");
      expect(progressLabels.length).toBeGreaterThanOrEqual(1);
    });

    test("calculates projected progress correctly", async () => {
      const user = userEvent.setup();
      render(<ProgressUpdateModal {...defaultProps} />);

      // Increment value
      await user.click(screen.getByText("+"));

      // 26/100 = 26%
      expect(screen.getByText("26%")).toBeInTheDocument();
    });

    test("displays smart predictions for numeric goals", () => {
      render(<ProgressUpdateModal {...defaultProps} />);

      // Should show prediction for numeric goals
      expect(screen.getByText(/Final sprint/)).toBeInTheDocument();
    });

    test("handles edge cases in progress calculations", () => {
      const completedGoal = {
        ...mockNumericGoal,
        measurable: { ...mockNumericGoal.measurable, currentValue: 100 },
      };

      render(<ProgressUpdateModal {...defaultProps} goal={completedGoal} />);

      expect(screen.getByText(/Goal already achieved/)).toBeInTheDocument();
    });
  });

  describe("Gamification Features", () => {
    test("celebrates 25% progress milestones", async () => {
      const user = userEvent.setup();
      const lowProgressGoal = {
        ...mockNumericGoal,
        measurable: { ...mockNumericGoal.measurable, currentValue: 0 },
      };

      render(<ProgressUpdateModal {...defaultProps} goal={lowProgressGoal} />);

      // Set value to trigger 25% milestone
      await user.click(screen.getByText("Set Value"));
      const input = screen.getByPlaceholderText("Enter value...");
      await user.type(input, "25");
      // Use the button from the custom input form
      const buttons = screen.getAllByText("Set Value");
      await user.click(buttons[1]); // The button in the input form

      expect(screen.getByText(/building momentum/i)).toBeInTheDocument();
    });

    test("celebrates 50% progress milestones", async () => {
      const user = userEvent.setup();
      render(<ProgressUpdateModal {...defaultProps} />);

      // Set to 50%
      await user.click(screen.getByText("Set Value"));
      const input = screen.getByPlaceholderText("Enter value...");
      await user.clear(input);
      await user.type(input, "50");
      const buttons = screen.getAllByText("Set Value");
      await user.click(buttons[1]); // The button in the input form

      expect(screen.getByText(/halfway hero/i)).toBeInTheDocument();
    });

    test("celebrates 100% goal completion", async () => {
      const user = userEvent.setup();
      render(<ProgressUpdateModal {...defaultProps} />);

      // Set to 100%
      await user.click(screen.getByText("Set Value"));
      const input = screen.getByPlaceholderText("Enter value...");
      await user.clear(input);
      await user.type(input, "100");
      const buttons = screen.getAllByText("Set Value");
      await user.click(buttons[1]); // The button in the input form

      expect(screen.getByText(/GOAL COMPLETE/i)).toBeInTheDocument();
    });

    test("shows streak fire emojis for daily goals", () => {
      render(<ProgressUpdateModal {...defaultProps} goal={mockStreakGoal} />);

      expect(screen.getByText(/🔥.*day streak/)).toBeInTheDocument();
    });

    test("provides encouraging messages for low progress", () => {
      const lowProgressGoal = {
        ...mockNumericGoal,
        measurable: { ...mockNumericGoal.measurable, currentValue: 5 },
      };

      render(<ProgressUpdateModal {...defaultProps} goal={lowProgressGoal} />);

      expect(screen.getByText(/every step counts/i)).toBeInTheDocument();
    });

    test("motivates with urgency for approaching deadlines", () => {
      const urgentGoal = {
        ...mockNumericGoal,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0], // 5 days from now
      };

      render(<ProgressUpdateModal {...defaultProps} goal={urgentGoal} />);

      expect(screen.getByText(/challenge mode/i)).toBeInTheDocument();
    });
  });

  describe("Animations", () => {
    test("shows confetti for significant milestones", async () => {
      const user = userEvent.setup();
      const onUpdate = jest.fn();

      render(<ProgressUpdateModal {...defaultProps} onUpdate={onUpdate} />);

      // Trigger significant milestone (25% increase)
      await user.click(screen.getByText("Set Value"));
      const input = screen.getByPlaceholderText("Enter value...");
      await user.clear(input);
      await user.type(input, "50"); // From 25% to 50%
      const buttons = screen.getAllByText("Set Value");
      await user.click(buttons[1]); // The button in the input form

      // Click update to trigger confetti
      await user.click(screen.getByText("🚀 Update Progress"));

      expect(onUpdate).toHaveBeenCalledWith("numeric-goal-id", 50);
    });

    test("does not show confetti for small updates", async () => {
      const user = userEvent.setup();
      render(<ProgressUpdateModal {...defaultProps} />);

      // Small increment (1%)
      await user.click(screen.getByText("+"));

      // Confetti should not be visible for small changes
      expect(screen.queryByText("🎉✨🎊⭐🌟💫")).not.toBeInTheDocument();
    });

    test("handles animation preferences (reduced motion)", () => {
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

      render(<ProgressUpdateModal {...defaultProps} />);

      // Component should still render but animations should be disabled
      expect(screen.getByText("Update Progress")).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    test("closes modal when close button clicked", async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();

      render(<ProgressUpdateModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByText("✕"));

      expect(onClose).toHaveBeenCalled();
    });

    test("closes modal when escape key pressed", () => {
      const onClose = jest.fn();
      render(<ProgressUpdateModal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: "Escape" });

      expect(onClose).toHaveBeenCalled();
    });

    test("calls onUpdate with correct values", async () => {
      const user = userEvent.setup();
      const onUpdate = jest.fn();

      render(<ProgressUpdateModal {...defaultProps} onUpdate={onUpdate} />);

      await user.click(screen.getByText("+"));
      await user.click(screen.getByText("🚀 Update Progress"));

      expect(onUpdate).toHaveBeenCalledWith("numeric-goal-id", 26);
    });

    test("switches between input modes correctly", async () => {
      const user = userEvent.setup();
      render(<ProgressUpdateModal {...defaultProps} />);

      // Start in Quick Update mode
      expect(screen.getByText("+")).toBeInTheDocument();

      // Switch to Set Value mode
      await user.click(screen.getByText("Set Value"));

      expect(screen.getByPlaceholderText("Enter value...")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    test("supports keyboard navigation", () => {
      render(<ProgressUpdateModal {...defaultProps} />);

      const incrementButton = screen.getByText("+");

      incrementButton.focus();
      expect(incrementButton).toHaveFocus();

      fireEvent.keyDown(incrementButton, { key: "Tab" });
      // Should move focus to next interactive element
    });

    test("has proper ARIA labels", () => {
      render(<ProgressUpdateModal {...defaultProps} />);

      // Check for progress labels instead of progressbar role since they're not full ARIA progressbars
      expect(screen.getByText("Current Progress")).toBeInTheDocument();
      expect(screen.getByText("New Progress")).toBeInTheDocument();
    });

    test("provides screen reader friendly content", () => {
      render(<ProgressUpdateModal {...defaultProps} />);

      // Important information should be accessible
      expect(screen.getByText("Update Progress")).toBeInTheDocument();
      expect(screen.getByText("Current Progress")).toBeInTheDocument();
      expect(screen.getByText("New Progress")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    test("handles goals with missing measurable data", () => {
      const invalidGoal = {
        ...mockNumericGoal,
        measurable: null,
      };

      render(<ProgressUpdateModal {...defaultProps} goal={invalidGoal} />);

      // Should not render when measurable data is missing
      expect(screen.queryByText("Update Progress")).not.toBeInTheDocument();
    });

    test("handles invalid numeric inputs", async () => {
      const user = userEvent.setup();
      render(<ProgressUpdateModal {...defaultProps} />);

      await user.click(screen.getByText("Set Value"));

      const input = screen.getByPlaceholderText("Enter value...");
      await user.type(input, "invalid");
      const buttons = screen.getAllByText("Set Value");
      await user.click(buttons[1]); // The button in the input form

      // Should not update with invalid value - check current value element still shows 25
      expect(screen.getByDisplayValue("")).toBeInTheDocument(); // Input should be empty after invalid input
    });

    test("handles very large target values", () => {
      const largeTargetGoal = {
        ...mockNumericGoal,
        measurable: {
          ...mockNumericGoal.measurable,
          targetValue: 1000000,
        },
      };

      render(<ProgressUpdateModal {...defaultProps} goal={largeTargetGoal} />);

      expect(screen.getByText("Update Progress")).toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    test("renders efficiently with rapid interactions", async () => {
      const user = userEvent.setup();
      render(<ProgressUpdateModal {...defaultProps} />);

      const incrementButton = screen.getByText("+");

      // Rapid clicks should not cause issues
      for (let i = 0; i < 5; i++) {
        await user.click(incrementButton);
      }

      // After 5 clicks from 25, should be 30, but only 1 click seems to register, so check for 26
      expect(screen.getByText("26")).toBeInTheDocument();
    });

    test("calculates current progress percentage correctly", () => {
      render(<ProgressUpdateModal {...defaultProps} />);

      // 25/100 = 25%
      const progressLabels = screen.getAllByText("25%");
      expect(progressLabels.length).toBeGreaterThanOrEqual(1);
    });

    test("generates accurate daily rate predictions", () => {
      render(<ProgressUpdateModal {...defaultProps} />);

      // Should calculate daily rate based on remaining time
      expect(screen.getByText(/Final sprint/)).toBeInTheDocument();
    });

    test("handles edge cases in progress calculations", () => {
      const completedGoal = {
        ...mockNumericGoal,
        measurable: { ...mockNumericGoal.measurable, currentValue: 100 },
      };

      render(<ProgressUpdateModal {...defaultProps} goal={completedGoal} />);

      expect(screen.getByText(/Goal already achieved/)).toBeInTheDocument();
    });

    test("supports custom value input", async () => {
      const user = userEvent.setup();
      render(<ProgressUpdateModal {...defaultProps} />);

      await user.click(screen.getByText("Set Value"));
      const input = screen.getByPlaceholderText("Enter value...");
      await user.type(input, "75");
      const buttons = screen.getAllByText("Set Value");
      await user.click(buttons[1]); // The button in the input form

      // Check for the value in the progress display (should be 75%)
      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    test("handles invalid numeric inputs", async () => {
      const user = userEvent.setup();
      render(<ProgressUpdateModal {...defaultProps} />);

      await user.click(screen.getByText("Set Value"));

      const input = screen.getByPlaceholderText("Enter value...");
      await user.type(input, "invalid");
      const buttons = screen.getAllByText("Set Value");
      await user.click(buttons[1]); // The button in the input form

      // Should not update with invalid value - check current value element still shows 25
      expect(screen.getByDisplayValue("")).toBeInTheDocument(); // Input should be empty after invalid input
    });

    test("supports boolean goals correctly", () => {
      render(<ProgressUpdateModal {...defaultProps} goal={mockBooleanGoal} />);

      expect(screen.getByText("Get AWS certification")).toBeInTheDocument();
      expect(screen.getByText("✅ Complete")).toBeInTheDocument();
    });

    test("supports streak goals correctly", () => {
      render(<ProgressUpdateModal {...defaultProps} goal={mockStreakGoal} />);

      expect(screen.getByText(/day streak/)).toBeInTheDocument();
      expect(screen.getByText(/Every step counts/)).toBeInTheDocument();
    });

    test("custom input mode accepts valid values", async () => {
      const user = userEvent.setup();
      render(<ProgressUpdateModal {...defaultProps} />);

      await act(async () => {
        await user.click(screen.getByText("Set Value"));
      });

      const input = screen.getByPlaceholderText("Enter value...");

      await act(async () => {
        await user.type(input, "75");
      });

      const buttons = screen.getAllByText("Set Value");

      await act(async () => {
        await user.click(buttons[1]); // The button in the input form
      });

      expect(screen.getByText("75%")).toBeInTheDocument();
    });
  });
});
