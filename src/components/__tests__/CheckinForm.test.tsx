// Define mock types and objects
interface MockAuth {
  currentUser: { uid: string } | null;
}

const mockAuthObject: MockAuth = {
  currentUser: { uid: "test-uid" },
};

// Mock dependencies
jest.mock("../../lib/firebase", () => ({
  auth: mockAuthObject,
  db: {},
}));

jest.mock("@/lib/firestore", () => ({
  saveCheckin: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
}));

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import CheckinForm from "../CheckinForm";
import { saveCheckin } from "@/lib/firestore";

describe("CheckinForm", () => {
  const mockGoals = [
    {
      id: "test-goal-id",
      name: "Test Goal",
    },
    {
      id: "test-goal-id-2",
      name: "Another Test Goal",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders check-in form with goals dropdown", () => {
    render(<CheckinForm goals={mockGoals} />);

    expect(screen.getByText(/Daily Check-In/i)).toBeInTheDocument();
    expect(screen.getByText("🎯 Test Goal")).toBeInTheDocument();
    expect(screen.getByText("🎯 Another Test Goal")).toBeInTheDocument();
  });

  test("allows submitting a check-in with goal update", async () => {
    const mockOnCheckinSaved = jest.fn();
    (saveCheckin as jest.Mock).mockResolvedValueOnce({});

    render(
      <CheckinForm goals={mockGoals} onCheckinSaved={mockOnCheckinSaved} />
    );

    // Select a goal from dropdown
    const goalSelect = screen.getAllByRole("combobox")[1]; // Second select is for goals
    fireEvent.change(goalSelect, { target: { value: "test-goal-id" } });

    // Add message
    const messageInput = screen.getByPlaceholderText(
      /What's on your mind today\?/i
    );
    fireEvent.change(messageInput, {
      target: { value: "Made good progress today" },
    });

    // Add goal description
    const descriptionInput = screen.getByPlaceholderText(
      /Describe your progress or criteria/i
    );
    fireEvent.change(descriptionInput, {
      target: { value: "Completed 3 major tasks" },
    });

    // Set due date - find the date input
    const dueDateInput = screen.getByDisplayValue("") as HTMLInputElement;
    expect(dueDateInput.type).toBe("date");
    fireEvent.change(dueDateInput, { target: { value: "2024-12-31" } });

    // Mark as completed
    const completeCheckbox = screen.getByRole("checkbox");
    fireEvent.click(completeCheckbox);

    // Submit form
    const submitButton = screen.getByRole("button", {
      name: /Submit Check-In/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(saveCheckin).toHaveBeenCalledWith(
        "test-uid",
        expect.objectContaining({
          circle: expect.any(String),
          message: "Made good progress today",
          goalId: "test-goal-id",
          goal: {
            name: "Test Goal",
            description: "Completed 3 major tasks",
            dueDate: "2024-12-31",
            completed: true,
          },
        })
      );

      const successMessage = screen.getByText(/Check-in saved!/i);
      expect(successMessage).toBeInTheDocument();
      expect(successMessage).toHaveClass("text-green-600");
      expect(mockOnCheckinSaved).toHaveBeenCalled();
    });
  });

  test("handles error during check-in submission", async () => {
    (saveCheckin as jest.Mock).mockRejectedValueOnce(
      new Error("Failed to save check-in")
    );

    render(<CheckinForm goals={mockGoals} />);

    // Add required message
    const messageInput = screen.getByPlaceholderText(
      /What's on your mind today\?/i
    );
    fireEvent.change(messageInput, { target: { value: "Test message" } });

    const submitButton = screen.getByRole("button", {
      name: /Submit Check-In/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const errorMessage = screen.getByText(/Failed to save check-in/i);
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveClass("text-red-600");
    });
  });

  test("allows submitting check-in without linking to a goal", async () => {
    (saveCheckin as jest.Mock).mockResolvedValueOnce({});

    render(<CheckinForm goals={mockGoals} />);

    // Add message
    const messageInput = screen.getByPlaceholderText(
      /What's on your mind today\?/i
    );
    fireEvent.change(messageInput, { target: { value: "General update" } });

    // Submit form
    const submitButton = screen.getByRole("button", {
      name: /Submit Check-In/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(saveCheckin).toHaveBeenCalledWith(
        "test-uid",
        expect.objectContaining({
          message: "General update",
          goalId: null,
          goal: undefined,
        })
      );

      const successMessage = screen.getByText(/Check-in saved!/i);
      expect(successMessage).toBeInTheDocument();
      expect(successMessage).toHaveClass("text-green-600");
    });
  });

  test("requires message field", () => {
    render(<CheckinForm goals={mockGoals} />);

    const submitButton = screen.getByRole("button", {
      name: /Submit Check-In/i,
    });
    fireEvent.click(submitButton);

    // Form should not submit without required message
    expect(screen.queryByText(/Check-in saved!/i)).not.toBeInTheDocument();
  });
});
