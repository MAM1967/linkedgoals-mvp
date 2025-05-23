// Define a type for our mock auth outside of any direct jest.mock callback scope if used by it.
interface MockAuth {
  currentUser: { uid: string } | null;
}
const mockAuthObject: MockAuth = {
  currentUser: { uid: "test-uid" },
};

// ALL jest.mock calls should be at the very top, before any imports
jest.mock("../../lib/firebase", () => ({
  auth: mockAuthObject,
  db: {},
}));
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(() => "mock-collection-ref"),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(() => "mock-timestamp"),
}));
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
}));

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import GoalInputPage from "@components/GoalInputPage";
// auth will be the mocked version due to jest.mock above
import { auth } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

describe("GoalInputPage", () => {
  beforeEach(() => {
    (addDoc as jest.Mock).mockClear();
    (collection as jest.Mock)
      .mockClear()
      .mockReturnValue("mock-collection-ref");
    // Reset currentUser on our mutable mockAuth object
    mockAuthObject.currentUser = { uid: "test-uid" };
  });

  test("renders initial step (Goal Description) and allows input", () => {
    render(<GoalInputPage />);

    // Check for Goal Description
    expect(screen.getByText(/Goal Description:/i)).toBeInTheDocument();
    const descriptionTextarea = screen.getByPlaceholderText(
      /What is the overall goal you want to achieve\?/i
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
      /What is the overall goal you want to achieve\?/i
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
        /What is the overall goal you want to achieve\?/i
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
    // Placeholder for Target Value is "e.g., 20"
    fireEvent.change(screen.getByPlaceholderText(/e.g., 20/i), {
      target: { value: "100" },
    });
    // Placeholder for Unit is "e.g., pages, tasks, hours"
    fireEvent.change(
      screen.getByPlaceholderText(/e.g., pages, tasks, hours/i),
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
        createdAt: "mock-timestamp",
      })
    );

    expect(
      await screen.findByText(/Goal saved successfully!/i)
    ).toBeInTheDocument();
  });

  test("shows an error if user is not logged in when trying to save", async () => {
    mockAuthObject.currentUser = null;

    render(<GoalInputPage />);

    // Step 1 -> 2
    fireEvent.change(
      screen.getByPlaceholderText(
        /What is the overall goal you want to achieve\?/i
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
    // Placeholder for Target Value is "e.g., 20"
    fireEvent.change(screen.getByPlaceholderText(/e.g., 20/i), {
      target: { value: "10" },
    });
    // Placeholder for Unit is "e.g., pages, tasks, hours"
    fireEvent.change(
      screen.getByPlaceholderText(/e.g., pages, tasks, hours/i),
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
        /What is the overall goal you want to achieve\?/i
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
    fireEvent.change(screen.getByPlaceholderText(/e.g., 20/i), {
      target: { value: "50" },
    }); // Target Value
    fireEvent.change(
      screen.getByPlaceholderText(/e.g., pages, tasks, hours/i),
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

    // Enter an invalid due date
    const dueDateInput = screen.getByLabelText(/Time-bound \(Due Date\):/i);
    fireEvent.change(dueDateInput, { target: { value: "invalid-date" } });

    const saveButton = screen.getByRole("button", { name: /Save Goal/i });
    fireEvent.click(saveButton);

    expect(
      await screen.findByText(
        /Invalid due date. Please ensure you have selected a valid date/i
      )
    ).toBeInTheDocument();
    expect(addDoc).not.toHaveBeenCalled();
  });
});
