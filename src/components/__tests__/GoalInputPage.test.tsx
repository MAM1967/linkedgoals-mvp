import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import GoalInputPage from "../GoalInputPage";
import { collection, addDoc } from "firebase/firestore";
import { auth } from "../../lib/firebase"; // Import the mocked auth

// Mock the firebase lib
jest.mock("../../lib/firebase", () => ({
  auth: {
    currentUser: {},
  },
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => "mock-collection-ref"),
  getDocs: jest.fn(() =>
    Promise.resolve({
      docs: [
        {
          id: "test-goal-id",
          data: () => mockGoals[0],
        },
      ],
    })
  ),
  addDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  serverTimestamp: jest.fn(() => ({ serverTimestamp: true })),
  Timestamp: {
    now: jest.fn(() => ({
      toDate: () => new Date(),
    })),
  },
}));

const mockGoals = [
  {
    id: "test-goal-id",
    description: "Comprehensive Test Goal",
    category: "Career",
    specific: "Very Specific",
    measurable: {
      type: "Numeric",
      targetValue: 100,
      currentValue: 0,
      unit: "pages",
    },
    achievable: "Yes, by working hard",
    relevant: "Relevant to my career",
    dueDate: "2024-12-31",
    status: "active",
    completed: false,
  },
];

describe("GoalInputPage", () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Set a default mock for currentUser for most tests
    Object.defineProperty(auth, "currentUser", {
      value: {
        uid: "test-uid",
        email: "test@example.com",
        displayName: "Test User",
      },
      writable: true,
    });

    (addDoc as jest.Mock).mockClear();
    (collection as jest.Mock)
      .mockClear()
      .mockReturnValue("mock-collection-ref");
  });

  afterEach(() => {
    jest.unmock("../../lib/firebase");
  });

  test("renders initial step (Goal Description) and allows input", () => {
    render(<GoalInputPage />);

    // Check for Goal Description
    expect(screen.getByText(/Goal Description:/i)).toBeInTheDocument();
    const descriptionTextarea = screen.getByPlaceholderText(
      /e\.g\., I want to become a better public speaker/i
    );
    expect(descriptionTextarea).toBeInTheDocument();

    fireEvent.change(descriptionTextarea, {
      target: { value: "My new goal description" },
    });
    expect(descriptionTextarea).toHaveValue("My new goal description");
  });

  test('navigates to the next step (Category) when "Next" is clicked', () => {
    render(<GoalInputPage />);

    // Fill in description to enable Next button if there's validation
    const descriptionTextarea = screen.getByPlaceholderText(
      /e\.g\., I want to become a better public speaker/i
    );
    fireEvent.change(descriptionTextarea, {
      target: { value: "Test Description" },
    });

    const nextButton = screen.getByRole("button", { name: /Next/i });
    fireEvent.click(nextButton);

    // Check for Category selection (Step 2)
    expect(screen.getByText(/Category:/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument(); // Assuming category is a select/combobox
  });

  test("allows filling all steps and attempts to save the goal", async () => {
    (addDoc as jest.Mock).mockResolvedValueOnce({ id: "test-goal-id" });

    render(<GoalInputPage />);

    // Step 1: Goal Description
    fireEvent.change(
      screen.getByPlaceholderText(
        /e\.g\., I want to become a better public speaker/i
      ),
      { target: { value: "Comprehensive Test Goal" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    // Step 2: Category
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    // Step 3: Specific
    fireEvent.change(
      screen.getByPlaceholderText(
        /What exactly do you want to achieve\? Be precise./i
      ),
      { target: { value: "Very Specific" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    // Step 4: Measurable (assuming default type is Numeric)
    // Placeholder for Target Value is "e.g., 10"
    fireEvent.change(screen.getByPlaceholderText(/e\.g\., 10/i), {
      target: { value: "100" },
    });
    // Placeholder for Unit is "Unit (e.g., chapters, tasks)"
    fireEvent.change(
      screen.getByPlaceholderText(/Unit \(e\.g\., chapters, tasks\)/i),
      { target: { value: "pages" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    // Step 5: Achievable
    fireEvent.change(
      screen.getByPlaceholderText(
        /Is this goal realistic and attainable for you\? How\?/i
      ),
      { target: { value: "Yes, by working hard" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    // Step 6: Relevant
    fireEvent.change(
      screen.getByPlaceholderText(
        /Why is this goal important to you\? Does it align with other objectives\?/i
      ),
      { target: { value: "It aligns with my objectives" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    // Step 7: Due Date (T)
    const dueDateInput = screen.getByLabelText(/Time-bound \(Due Date\):/i);
    fireEvent.change(dueDateInput, { target: { value: "2024-12-31" } });
    const saveButton = screen.getByRole("button", { name: /Save Goal/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalledTimes(1);
    });

    expect(collection).toHaveBeenCalledWith(
      expect.anything(),
      "users/test-uid/goals"
    );
    expect(addDoc).toHaveBeenCalledWith(
      "mock-collection-ref",
      expect.objectContaining({
        description: "Comprehensive Test Goal",
        category: "Career",
        specific: "Very Specific",
        measurable: expect.objectContaining({
          type: "Numeric",
          targetValue: 100,
          currentValue: 0,
          unit: "pages",
        }),
        achievable: "Yes, by working hard",
        relevant: "It aligns with my objectives",
        dueDate: "2024-12-31",
        status: "active",
        completed: false,
        createdAt: { serverTimestamp: true },
      })
    );

    expect(
      await screen.findByText(/Goal saved successfully!/i)
    ).toBeInTheDocument();
  });

  test("shows an error if user is not logged in when trying to save", async () => {
    // Override the mock for this specific test
    Object.defineProperty(auth, "currentUser", {
      value: null,
      writable: true,
    });

    render(<GoalInputPage />);

    // Step 1 -> 2
    fireEvent.change(
      screen.getByPlaceholderText(
        /e\.g\., I want to become a better public speaker/i
      ),
      { target: { value: "Test" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    // Step 2 -> 3
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    // Step 3 -> 4
    fireEvent.change(
      screen.getByPlaceholderText(
        /What exactly do you want to achieve\? Be precise./i
      ),
      { target: { value: "Test" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    // Step 4 -> 5 (Measurable)
    // Placeholder for Target Value is "e.g., 10"
    fireEvent.change(screen.getByPlaceholderText(/e\.g\., 10/i), {
      target: { value: "10" },
    });
    // Placeholder for Unit is "Unit (e.g., chapters, tasks)"
    fireEvent.change(
      screen.getByPlaceholderText(/Unit \(e\.g\., chapters, tasks\)/i),
      { target: { value: "tasks" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    // Step 5 -> 6 (Achievable)
    fireEvent.change(
      screen.getByPlaceholderText(
        /Is this goal realistic and attainable for you\? How\?/i
      ),
      { target: { value: "Test" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    // Step 6 -> 7 (Relevant)
    fireEvent.change(
      screen.getByPlaceholderText(
        /Why is this goal important to you\? Does it align with other objectives\?/i
      ),
      { target: { value: "Test" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    // Step 7: Due Date
    fireEvent.change(screen.getByLabelText(/Time-bound \(Due Date\):/i), {
      target: { value: "2025-01-01" },
    });

    const saveButton = screen.getByRole("button", { name: /Save Goal/i });
    fireEvent.click(saveButton);

    expect(
      await screen.findByText(/You must be logged in to save a goal./i)
    ).toBeInTheDocument();
    expect(addDoc).not.toHaveBeenCalled();
  });

  test("shows an error if due date is invalid", async () => {
    render(<GoalInputPage />);

    // Fill all fields with valid data
    fireEvent.change(
      screen.getByPlaceholderText(
        /e\.g\., I want to become a better public speaker/i
      ),
      { target: { value: "Test Goal for Invalid Date" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /Next/i })); // To Category

    fireEvent.click(screen.getByRole("button", { name: /Next/i })); // To Specific (Category is default 'Career')

    fireEvent.change(
      screen.getByPlaceholderText(
        /What exactly do you want to achieve\? Be precise./i
      ),
      { target: { value: "Test Specific" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /Next/i })); // To Measurable

    // Step 4: Measurable - Explicitly select Numeric and ensure valid inputs
    // Assuming the select for measurableType can be found by its label or a test ID if available.
    // For now, we know Numeric is default. Let's ensure its inputs are robustly filled.
    // If there was a select element: fireEvent.change(screen.getByLabelText(/Measurable By:/i), { target: { value: "Numeric" } });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\., 10/i), {
      target: { value: "50" },
    }); // Target Value
    fireEvent.change(
      screen.getByPlaceholderText(/Unit \(e\.g\., chapters, tasks\)/i),
      { target: { value: "items" } }
    ); // Unit
    fireEvent.click(screen.getByRole("button", { name: /Next/i })); // To Achievable

    fireEvent.change(
      screen.getByPlaceholderText(
        /Is this goal realistic and attainable for you\? How\?/i
      ),
      { target: { value: "Test Achievable" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /Next/i })); // To Relevant

    fireEvent.change(
      screen.getByPlaceholderText(
        /Why is this goal important to you\? Does it align with other objectives\?/i
      ),
      { target: { value: "Test Relevant" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /Next/i })); // To Due Date

    // Enter an invalid due date by directly setting the component state
    const dueDateInput = screen.getByLabelText(/Time-bound \(Due Date\):/i);
    // Since HTML date inputs reject invalid dates, we need to use a different approach
    // Let's simulate setting the input to a clearly invalid format
    Object.defineProperty(dueDateInput, "value", {
      writable: true,
      value: "invalid-date-format",
    });
    fireEvent.change(dueDateInput, {
      target: { value: "invalid-date-format" },
    });

    const saveButton = screen.getByRole("button", { name: /Save Goal/i });
    fireEvent.click(saveButton);

    expect(
      await screen.findByText(
        /Invalid due date. Please ensure you have selected a valid date \(e\.g\., YYYY-MM-DD or MM\/DD\/YYYY\)\./i
      )
    ).toBeInTheDocument();
    expect(addDoc).not.toHaveBeenCalled();
  });
});
