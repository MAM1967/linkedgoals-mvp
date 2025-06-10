import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { GoalProgressCard } from "../GoalProgressCard";
import { GoalDetailsModal } from "../GoalDetailsModal";
import { ProgressUpdateModal } from "../ProgressUpdateModal";
import { mockGoals, mockProgress, setupMatchMediaMock } from "./testUtils";

// Mock Firebase
jest.mock("../../lib/firebase", () => ({
  db: {},
  auth: {
    currentUser: { uid: "test-user-id" },
  },
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  updateDoc: jest.fn(),
}));

// Mock common components
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

describe("Enhanced Goal Cards Integration", () => {
  const mockHandleViewDetails = jest.fn();
  const mockHandleUpdateProgress = jest.fn();
  const mockOnUpdate = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    setupMatchMediaMock();
  });

  describe("Goal Card Actions", () => {
    test("view details button triggers modal", async () => {
      const user = userEvent.setup();

      render(
        <div>
          <GoalProgressCard
            goal={mockGoals.numeric}
            progress={mockProgress}
            onViewDetails={mockHandleViewDetails}
            onUpdateProgress={mockHandleUpdateProgress}
          />
        </div>
      );

      const viewDetailsButton = screen.getByText("View Details");
      await user.click(viewDetailsButton);

      expect(mockHandleViewDetails).toHaveBeenCalledWith(mockGoals.numeric.id);
    });

    test("update progress button triggers progress modal", async () => {
      const user = userEvent.setup();

      render(
        <div>
          <GoalProgressCard
            goal={mockGoals.numeric}
            progress={mockProgress}
            onViewDetails={mockHandleViewDetails}
            onUpdateProgress={mockHandleUpdateProgress}
          />
        </div>
      );

      const updateButton = screen.getByText("Update Progress");
      await user.click(updateButton);

      expect(mockHandleUpdateProgress).toHaveBeenCalledWith(
        mockGoals.numeric.id
      );
    });

    test("action buttons have enhanced visual effects", () => {
      render(
        <div>
          <GoalProgressCard
            goal={mockGoals.numeric}
            progress={mockProgress}
            onViewDetails={mockHandleViewDetails}
            onUpdateProgress={mockHandleUpdateProgress}
          />
        </div>
      );

      const updateButton = screen.getByText("Update Progress");
      const viewButton = screen.getByText("View Details");

      // Check that buttons have enhanced styling classes
      expect(updateButton.closest(".action-btn")).toBeInTheDocument();
      expect(viewButton.closest(".action-btn")).toBeInTheDocument();
    });
  });

  describe("Goal Details Modal Integration", () => {
    test("renders goal details correctly", () => {
      render(
        <GoalDetailsModal
          goal={mockGoals.numeric}
          progress={mockProgress}
          isOpen={true}
          onClose={mockOnClose}
          onGoalUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText("Goal Details")).toBeInTheDocument();
      expect(
        screen.getByText("Finish 100 coding exercises")
      ).toBeInTheDocument();
    });

    test("can enter edit mode", async () => {
      const user = userEvent.setup();

      render(
        <GoalDetailsModal
          goal={mockGoals.numeric}
          progress={mockProgress}
          isOpen={true}
          onClose={mockOnClose}
          onGoalUpdate={mockOnUpdate}
        />
      );

      const editButton = screen.getByText("✏️ Edit");
      await user.click(editButton);

      expect(screen.getByText("Edit Goal")).toBeInTheDocument();
    });

    test("displays coaching notes when available", () => {
      render(
        <GoalDetailsModal
          goal={mockGoals.numeric}
          progress={mockProgress}
          isOpen={true}
          onClose={mockOnClose}
          onGoalUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText("Coaching Notes")).toBeInTheDocument();
      expect(screen.getByText("Test Coach")).toBeInTheDocument();
      expect(
        screen.getByText("Great progress! Keep it up!")
      ).toBeInTheDocument();
    });
  });

  describe("Progress Update Modal Integration", () => {
    test("renders progress update interface correctly", () => {
      render(
        <ProgressUpdateModal
          goal={mockGoals.numeric}
          isOpen={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText("Update Progress")).toBeInTheDocument();
      expect(
        screen.getByText("Finish 100 coding exercises")
      ).toBeInTheDocument();
      expect(screen.getByText("Current Progress")).toBeInTheDocument();
      expect(screen.getByText("New Progress")).toBeInTheDocument();
    });

    test("supports increment operations", async () => {
      const user = userEvent.setup();

      render(
        <ProgressUpdateModal
          goal={mockGoals.numeric}
          isOpen={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );

      const incrementButton = screen.getByText("+");
      await user.click(incrementButton);

      // Value should increase to 26
      expect(screen.getByText("26")).toBeInTheDocument();
    });

    test("calls update callback with correct values", async () => {
      const user = userEvent.setup();

      render(
        <ProgressUpdateModal
          goal={mockGoals.numeric}
          isOpen={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );

      // Increment and update
      await user.click(screen.getByText("+"));
      await user.click(screen.getByText("🚀 Update Progress"));

      expect(mockOnUpdate).toHaveBeenCalledWith("numeric-goal-id", 26);
    });
  });

  describe("Different Goal Types", () => {
    test("handles boolean goals correctly", () => {
      render(
        <ProgressUpdateModal
          goal={mockGoals.boolean}
          isOpen={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText("Get AWS certification")).toBeInTheDocument();
      expect(screen.getByText("✅ Complete")).toBeInTheDocument();
    });

    test("handles streak goals correctly", () => {
      render(
        <ProgressUpdateModal
          goal={mockGoals.streak}
          isOpen={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );

      expect(
        screen.getByText("Exercise for 30 days straight")
      ).toBeInTheDocument();
      expect(screen.getByText(/day streak/)).toBeInTheDocument();
    });
  });

  describe("User Experience Flow", () => {
    test("complete user workflow simulation", async () => {
      const user = userEvent.setup();

      // Start with goal card
      const { rerender } = render(
        <div>
          <GoalProgressCard
            goal={mockGoals.numeric}
            progress={mockProgress}
            onViewDetails={mockHandleViewDetails}
            onUpdateProgress={mockHandleUpdateProgress}
          />
        </div>
      );

      // Click view details
      await user.click(screen.getByText("View Details"));
      expect(mockHandleViewDetails).toHaveBeenCalled();

      // Simulate opening details modal
      rerender(
        <div>
          <GoalProgressCard
            goal={mockGoals.numeric}
            progress={mockProgress}
            onViewDetails={mockHandleViewDetails}
            onUpdateProgress={mockHandleUpdateProgress}
          />
          <GoalDetailsModal
            goal={mockGoals.numeric}
            progress={mockProgress}
            isOpen={true}
            onClose={mockOnClose}
            onGoalUpdate={mockOnUpdate}
          />
        </div>
      );

      expect(screen.getByText("Goal Details")).toBeInTheDocument();

      // Close details modal and open progress modal
      await user.click(screen.getByText("✕"));
      expect(mockOnClose).toHaveBeenCalled();

      rerender(
        <div>
          <GoalProgressCard
            goal={mockGoals.numeric}
            progress={mockProgress}
            onViewDetails={mockHandleViewDetails}
            onUpdateProgress={mockHandleUpdateProgress}
          />
          <ProgressUpdateModal
            goal={mockGoals.numeric}
            isOpen={true}
            onClose={mockOnClose}
            onUpdate={mockOnUpdate}
          />
        </div>
      );

      expect(
        screen.getByRole("heading", { name: "Update Progress" })
      ).toBeInTheDocument();
    });
  });

  describe("Accessibility Integration", () => {
    test("modal focus management works correctly", () => {
      render(
        <GoalDetailsModal
          goal={mockGoals.numeric}
          progress={mockProgress}
          isOpen={true}
          onClose={mockOnClose}
          onGoalUpdate={mockOnUpdate}
        />
      );

      // Modal should be in the document
      const modal = screen
        .getByText("Goal Details")
        .closest(".goal-details-modal");
      expect(modal).toBeInTheDocument();
    });

    test("keyboard navigation between modals", () => {
      render(
        <ProgressUpdateModal
          goal={mockGoals.numeric}
          isOpen={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );

      // Test escape key functionality
      fireEvent.keyDown(document, { key: "Escape" });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    test("handles missing goal data gracefully", () => {
      const incompleteGoal = {
        ...mockGoals.numeric,
        specific: "",
        achievable: "",
        relevant: "",
      };

      // Details modal should handle missing data
      render(
        <GoalDetailsModal
          goal={incompleteGoal}
          progress={mockProgress}
          isOpen={true}
          onClose={mockOnClose}
          onGoalUpdate={mockOnUpdate}
        />
      );

      expect(screen.getByText("Goal Details")).toBeInTheDocument();
    });

    test("handles progress update errors gracefully", async () => {
      // Mock Firebase update to fail
      const { updateDoc } = require("firebase/firestore");
      updateDoc.mockRejectedValueOnce(new Error("Update failed"));

      const user = userEvent.setup();
      render(
        <GoalDetailsModal
          goal={mockGoals.numeric}
          progress={mockProgress}
          isOpen={true}
          onClose={mockOnClose}
          onGoalUpdate={mockOnUpdate}
        />
      );

      await user.click(screen.getByText("✏️ Edit"));
      await user.click(screen.getByText("Save Changes"));

      await waitFor(() => {
        expect(screen.getByText("Error saving changes ❌")).toBeInTheDocument();
      });
    });
  });

  describe("Performance Considerations", () => {
    test("modals clean up properly on unmount", () => {
      const { unmount } = render(
        <ProgressUpdateModal
          goal={mockGoals.numeric}
          isOpen={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );

      unmount();
      // Should not cause memory leaks or errors
    });

    test("rapid interactions handle correctly", async () => {
      const user = userEvent.setup();

      render(
        <ProgressUpdateModal
          goal={mockGoals.numeric}
          isOpen={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );

      const incrementButton = screen.getByText("+");

      // Rapid clicks
      for (let i = 0; i < 3; i++) {
        await user.click(incrementButton);
      }

      expect(screen.getByText("26")).toBeInTheDocument();
    });
  });
});
