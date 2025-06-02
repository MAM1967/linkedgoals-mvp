describe("LinkedGoals - Goal Management E2E", () => {
  beforeEach(() => {
    // Visit the app - adjust URL based on your setup
    cy.visit("http://localhost:3000");

    // Mock or setup authentication state
    // You might need to set up test user accounts or mock auth
  });

  it("should allow user to create and manage a complete goal", () => {
    // 1. Authentication (if required)
    cy.get('[data-testid="login-button"]').should("be.visible");
    // For testing, you might want to bypass real auth or use test accounts

    // 2. Navigate to goal creation
    cy.get('[data-testid="create-goal-button"]').should("be.visible").click();

    // 3. Fill out SMART goal form
    // Step 1: Description
    cy.get('textarea[placeholder*="What is the overall goal"]').type(
      "Learn Spanish to conversational level"
    );

    cy.get("button").contains("Next").click();

    // Step 2: Category
    cy.get("select").select("Personal Development");
    cy.get("button").contains("Next").click();

    // Step 3: Specific
    cy.get('textarea[placeholder*="What exactly do you want"]').type(
      "Have a 10-minute conversation in Spanish with a native speaker"
    );

    cy.get("button").contains("Next").click();

    // Step 4: Measurable
    cy.get('input[placeholder*="e.g., 20"]').type("10");
    cy.get('input[placeholder*="pages, tasks, hours"]').type("minutes");
    cy.get("button").contains("Next").click();

    // Step 5: Achievable
    cy.get('textarea[placeholder*="Is this goal realistic"]').type(
      "Yes, by studying 30 minutes daily and practicing with language exchange partners"
    );

    cy.get("button").contains("Next").click();

    // Step 6: Relevant
    cy.get('textarea[placeholder*="Why is this goal important"]').type(
      "Will help me communicate with Spanish-speaking clients and enhance career opportunities"
    );

    cy.get("button").contains("Next").click();

    // Step 7: Time-bound
    cy.get('input[type="date"]').type("2024-06-30");

    // Save goal
    cy.get("button").contains("Save Goal").click();

    // 4. Verify goal creation success
    cy.contains("Goal saved successfully!").should("be.visible");

    // 5. Navigate to dashboard
    cy.get('[data-testid="dashboard-link"]').click();

    // 6. Verify goal appears on dashboard
    cy.contains("Learn Spanish to conversational level").should("be.visible");

    // 7. Create a check-in
    cy.get('[data-testid="checkin-button"]').click();

    // Fill out check-in
    cy.get('textarea[placeholder*="What\'s on your mind"]').type(
      "Completed 45 minutes of Spanish study today. Learned 20 new vocabulary words."
    );

    // Link to goal
    cy.get("select").last().select("Learn Spanish to conversational level");

    // Submit check-in
    cy.get("button").contains("Submit Check-In").click();

    // 8. Verify check-in success
    cy.contains("Check-in saved!").should("be.visible");

    // 9. Verify check-in appears on dashboard
    cy.contains("Completed 45 minutes of Spanish study").should("be.visible");
  });

  it("should handle goal sharing functionality", () => {
    // Assuming we have a goal created, test sharing
    cy.visit("http://localhost:3000/dashboard");

    // Find share button for a goal
    cy.get('[data-testid="share-goal-button"]').first().click();

    // Verify share page loads
    cy.url().should("include", "/share");
    cy.contains("Share Your Progress").should("be.visible");

    // Test social sharing buttons
    cy.get('[data-testid="share-twitter"]').should("be.visible");
    cy.get('[data-testid="share-linkedin"]').should("be.visible");
    cy.get('[data-testid="share-facebook"]').should("be.visible");

    // Test copy link functionality
    cy.get('[data-testid="copy-link-button"]').click();
    // You might want to verify clipboard content here
  });

  it("should handle goal completion flow", () => {
    cy.visit("http://localhost:3000/dashboard");

    // Find a goal and mark it as complete
    cy.get('[data-testid="goal-item"]')
      .first()
      .within(() => {
        cy.get('[data-testid="complete-goal-button"]').click();
      });

    // Verify completion
    cy.contains("Goal completed!").should("be.visible");

    // Verify goal shows as completed
    cy.get('[data-testid="completed-goals"]').should(
      "contain",
      "Learn Spanish to conversational level"
    );
  });

  it("should handle mobile responsiveness", () => {
    // Test on mobile viewport
    cy.viewport("iphone-x");

    cy.visit("http://localhost:3000");

    // Verify mobile navigation works
    cy.get('[data-testid="mobile-menu-button"]').click();
    cy.get('[data-testid="mobile-nav"]').should("be.visible");

    // Test goal creation on mobile
    cy.get('[data-testid="create-goal-mobile"]').click();

    // Verify form is usable on mobile
    cy.get('textarea[placeholder*="What is the overall goal"]')
      .should("be.visible")
      .and("have.css", "font-size")
      .and("match", /16px|1rem/); // Ensure font size is at least 16px to prevent zoom on iOS
  });

  it("should handle offline scenarios", () => {
    cy.visit("http://localhost:3000");

    // Simulate offline
    cy.window().then((win) => {
      cy.stub(win.navigator, "onLine").value(false);
      win.dispatchEvent(new Event("offline"));
    });

    // Try to create a goal while offline
    cy.get('[data-testid="create-goal-button"]').click();

    // Fill out form
    cy.get('textarea[placeholder*="What is the overall goal"]').type(
      "Test offline goal"
    );

    // Try to save
    cy.get("button").contains("Save Goal").click();

    // Should show offline message
    cy.contains("You appear to be offline").should("be.visible");
  });

  it("should handle performance requirements", () => {
    // Test page load performance
    cy.visit("http://localhost:3000", {
      onBeforeLoad: (win) => {
        // Start performance measurement
        win.performance.mark("app-start");
      },
      onLoad: (win) => {
        win.performance.mark("app-loaded");
        win.performance.measure("app-load-time", "app-start", "app-loaded");

        const measure = win.performance.getEntriesByName("app-load-time")[0];
        expect(measure.duration).to.be.lessThan(3000); // Should load in under 3 seconds
      },
    });

    // Test interaction performance
    cy.get('[data-testid="create-goal-button"]').click();

    // Form should be interactive quickly
    cy.get('textarea[placeholder*="What is the overall goal"]')
      .should("be.visible")
      .type("Performance test goal");

    // Should be responsive
    cy.get('textarea[placeholder*="What is the overall goal"]').should(
      "have.value",
      "Performance test goal"
    );
  });
});

// Additional command definitions for Cypress
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      createTestGoal(goalData: any): Chainable<void>;
    }
  }
}

// Custom commands
Cypress.Commands.add("login", (email: string, password: string) => {
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-submit"]').click();
  cy.url().should("include", "/dashboard");
});

Cypress.Commands.add("createTestGoal", (goalData) => {
  cy.get('[data-testid="create-goal-button"]').click();

  // Fill out form with provided data
  cy.get('textarea[placeholder*="What is the overall goal"]').type(
    goalData.description
  );
  cy.get("button").contains("Next").click();

  // Continue through all steps...
  // (Implementation would depend on your exact form structure)
});
