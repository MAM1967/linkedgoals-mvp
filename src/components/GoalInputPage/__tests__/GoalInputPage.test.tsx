import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import GoalInputPage from "../GoalInputPage"; // Adjusted path: one level up from __tests__

// Mock Firebase services
// Path is now ../../lib/firebase relative to GoalInputPage.tsx, so from here it's ../../../lib/firebase
jest.mock("../../../lib/firebase", () => ({
  auth: {
    currentUser: {
      uid: "test-user-123",
      displayName: "Test User",
    },
  },
  db: {
    // Mock db object, actual instance not needed for these tests
  },
}));

const mockAddDoc = jest.fn();
const mockCollection = jest.fn();
const mockServerTimestamp = jest.fn(() => "mock-server-timestamp-value"); // Firestore serverTimestamp returns a sentinel

// Path is now ../../firebase/firestore relative to GoalInputPage.tsx, so from here it's ../../../firebase/firestore
jest.mock("firebase/firestore", () => ({
  collection: (db: any, path: string) => mockCollection(db, path),
  addDoc: (collectionRef: any, data: any) => mockAddDoc(collectionRef, data),
  serverTimestamp: () => mockServerTimestamp(),
  // Add other Firestore functions if they are directly used and need mocking
}));

describe("GoalInputPage - Submission Logic", () => {
  beforeEach(() => {
    // Clear mock call history before each test
    mockAddDoc.mockClear();
    mockCollection.mockClear();
    mockServerTimestamp.mockClear();

    // Setup a successful resolution for addDoc for positive test cases
    mockAddDoc.mockResolvedValue({ id: "new-mock-goal-id" });
    // Mock collection to return a simple string an an identifier for the collectionRef
    mockCollection.mockReturnValue("mock-collection-reference");
  });

  test("UT_GI_SUBMIT_001: Successful Goal Submission with Numeric Measurable Type", async () => {
    render(<GoalInputPage />);

    // Helper function to fill form steps
    const fillFormSteps = () => {
      // Step 1: Goal Description
      fireEvent.change(screen.getByLabelText(/Goal Description:/i), {
        target: { value: "Conquer Mount Everest" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Next/i }));

      // Step 2: Category
      fireEvent.change(screen.getByLabelText(/Category:/i), {
        target: { value: "Skills" },
      }); // Assuming 'Skills' is a valid category
      fireEvent.click(screen.getByRole("button", { name: /Next/i }));

      // Step 3: Specific
      fireEvent.change(screen.getByLabelText(/Specific:/i), {
        target: { value: "Reach the summit by Q4 2025" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Next/i }));

      // Step 4: Measurable (Numeric)
      // Select "Numeric" type first
      fireEvent.change(screen.getByLabelText(/Measurable By:/i), {
        target: { value: "Numeric" },
      });
      // Then fill numeric inputs
      fireEvent.change(screen.getByLabelText(/Target Value:/i), {
        target: { value: "8848" },
      }); // Height of Everest in meters
      fireEvent.change(screen.getByLabelText(/Unit:/i), {
        target: { value: "meters climbed" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Next/i }));

      // Step 5: Achievable
      fireEvent.change(screen.getByLabelText(/Achievable:/i), {
        target: { value: "Through rigorous training and a guided expedition" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Next/i }));

      // Step 6: Relevant
      fireEvent.change(screen.getByLabelText(/Relevant:/i), {
        target: {
          value: "Ultimate test of endurance and personal achievement",
        },
      });
      fireEvent.click(screen.getByRole("button", { name: /Next/i }));

      // Step 7: Time-bound (Due Date)
      // Ensure date is in YYYY-MM-DD for input.value
      fireEvent.change(screen.getByLabelText(/Time-bound \(Due Date\):/i), {
        target: { value: "2025-12-31" },
      });
    };

    fillFormSteps();

    // Click the "Save Goal" button (should be visible on the last step)
    const saveButton = screen.getByRole("button", { name: /Save Goal/i });
    fireEvent.click(saveButton);

    // Assertions
    // 1. addDoc was called
    await waitFor(() => {
      expect(mockAddDoc).toHaveBeenCalledTimes(1);
    });

    // 2. collection was called with the correct path
    expect(mockCollection).toHaveBeenCalledWith(
      expect.anything(),
      "users/test-user-123/goals"
    );

    // 3. addDoc was called with the correct data structure
    expect(mockAddDoc).toHaveBeenCalledWith(
      "mock-collection-reference", // The mocked return value of collection()
      expect.objectContaining({
        description: "Conquer Mount Everest",
        category: "Skills",
        specific: "Reach the summit by Q4 2025",
        measurable: {
          type: "Numeric",
          targetValue: 8848, // Ensure this matches how GoalInputPage parses it (e.g., parseFloat)
          currentValue: 0,
          unit: "meters climbed",
        },
        achievable: "Through rigorous training and a guided expedition",
        relevant: "Ultimate test of endurance and personal achievement",
        dueDate: "2025-12-31", // Should be validated/normalized format
        status: "active",
        completed: false,
        createdAt: "mock-server-timestamp-value",
      })
    );

    // 4. Success message is shown
    await waitFor(() => {
      expect(screen.getByText(/Goal saved successfully!/i)).toBeInTheDocument();
    });

    // 5. Form is reset (current step is 1, and a field from step 1 is cleared)
    await waitFor(() => {
      // Check if the title indicates Step 1
      expect(
        screen.getByText(/Create New SMART Goal \(1\/7\)/i)
      ).toBeInTheDocument();
    });
    // Check if the first input field (Goal Description) is cleared
    expect(screen.getByLabelText(/Goal Description:/i)).toHaveValue("");
  });
});
