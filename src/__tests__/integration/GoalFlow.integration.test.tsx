import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";

// Import your actual components (not mocked)
import App from "../../App";

// This test uses Firebase emulator - make sure it's running
// firebase emulators:start --only firestore,auth

describe("Goal Creation and Check-in Integration", () => {
  const user = userEvent.setup();

  beforeEach(async () => {
    // Clear Firebase emulator data before each test
    // You'll need to implement this helper function
    // await clearFirebaseData();
  });

  it("should complete full goal creation and check-in flow", async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    // 1. User should see landing page or login
    expect(screen.getByText(/LinkedGoals/i)).toBeInTheDocument();

    // 2. Navigate to goal creation (assuming user is authenticated or we simulate it)
    const createGoalButton = screen.getByText(/Create Goal/i);
    await user.click(createGoalButton);

    // 3. Fill out goal form step by step
    // Step 1: Description
    const descriptionInput = screen.getByPlaceholderText(
      /What is the overall goal/i
    );
    await user.type(descriptionInput, "Complete my first 5K run");

    const nextButton = screen.getByRole("button", { name: /Next/i });
    await user.click(nextButton);

    // Step 2: Category (should auto-advance or select)
    await waitFor(() => {
      expect(screen.getByText(/Category/i)).toBeInTheDocument();
    });
    await user.click(nextButton);

    // Step 3: Specific
    const specificInput = screen.getByPlaceholderText(
      /What exactly do you want to achieve/i
    );
    await user.type(
      specificInput,
      "Run a full 5K without stopping in under 30 minutes"
    );
    await user.click(nextButton);

    // Step 4: Measurable
    await waitFor(() => {
      expect(screen.getByText(/Measurable/i)).toBeInTheDocument();
    });

    const targetInput = screen.getByPlaceholderText(/e.g., 20/i);
    await user.type(targetInput, "1");

    const unitInput = screen.getByPlaceholderText(/e.g., pages, tasks, hours/i);
    await user.type(unitInput, "race");
    await user.click(nextButton);

    // Step 5: Achievable
    const achievableInput = screen.getByPlaceholderText(
      /Is this goal realistic/i
    );
    await user.type(achievableInput, "Yes, I can train gradually over 8 weeks");
    await user.click(nextButton);

    // Step 6: Relevant
    const relevantInput = screen.getByPlaceholderText(
      /Why is this goal important/i
    );
    await user.type(relevantInput, "Improve my health and fitness level");
    await user.click(nextButton);

    // Step 7: Time-bound
    const dueDateInput = screen.getByLabelText(/Time-bound/i);
    await user.type(dueDateInput, "2024-12-31");

    // Save the goal
    const saveButton = screen.getByRole("button", { name: /Save Goal/i });
    await user.click(saveButton);

    // 4. Verify goal was saved and user redirected to dashboard
    await waitFor(
      () => {
        expect(
          screen.getByText(/Goal saved successfully/i)
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // 5. Navigate to dashboard to see the created goal
    const dashboardLink = screen.getByText(/Dashboard/i);
    await user.click(dashboardLink);

    await waitFor(() => {
      expect(screen.getByText(/Complete my first 5K run/i)).toBeInTheDocument();
    });

    // 6. Create a check-in for this goal
    const checkinButton = screen.getByText(/Daily Check-In/i);
    await user.click(checkinButton);

    // Fill out check-in form
    const messageInput = screen.getByPlaceholderText(
      /What's on your mind today/i
    );
    await user.type(messageInput, "Completed a 2K training run today");

    // Select the goal we just created
    const goalSelect = screen.getByDisplayValue(/Select a goal/i);
    await user.click(goalSelect);

    // This assumes the goal appears in the dropdown
    const goalOption = screen.getByText(/Complete my first 5K run/i);
    await user.click(goalOption);

    // Submit check-in
    const submitCheckinButton = screen.getByRole("button", {
      name: /Submit Check-In/i,
    });
    await user.click(submitCheckinButton);

    // 7. Verify check-in was saved
    await waitFor(() => {
      expect(screen.getByText(/Check-in saved/i)).toBeInTheDocument();
    });

    // 8. Verify check-in appears on dashboard
    await waitFor(() => {
      expect(
        screen.getByText(/Completed a 2K training run today/i)
      ).toBeInTheDocument();
    });
  }, 30000); // Longer timeout for integration test

  it("should handle goal sharing flow", async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    // Assuming we have a goal already created, navigate to share
    // This test would verify the social sharing functionality
    // Implementation depends on your app's navigation structure
  });

  it("should handle authentication flow", async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    // Test sign up, sign in, sign out flows
    // This would test the actual Firebase Auth integration
  });
});

// Helper function to clear Firebase emulator data
// You'll need to implement this based on your Firebase setup
/*
async function clearFirebaseData() {
  // Clear Firestore data
  const response = await fetch(
    'http://localhost:8080/emulator/v1/projects/demo-project/databases/(default)/documents',
    { method: 'DELETE' }
  );
  
  // Clear Auth data
  const authResponse = await fetch(
    'http://localhost:9099/emulator/v1/projects/demo-project/accounts',
    { method: 'DELETE' }
  );
}
*/
