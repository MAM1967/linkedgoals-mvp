import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import EmailPreferences from "../EmailPreferences";
import { useAuth } from "../../hooks/useAuth";
import { getDoc, updateDoc } from "firebase/firestore";

// Mock Firebase
jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock("../../lib/firebase", () => ({
  db: {},
}));

// Mock useAuth hook
jest.mock("../../hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;

describe("EmailPreferences", () => {
  const mockUser = {
    uid: "test-user-123",
    email: "test@example.com",
    customEmailVerified: true,
  };

  const defaultPreferences = {
    weeklyUpdates: true,
    announcements: true,
    goalReminders: true,
    coachingNotes: true,
    marketingEmails: false,
    frequency: "weekly",
    unsubscribeAll: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Authentication States", () => {
    it("shows login message when user is not authenticated", () => {
      mockUseAuth.mockReturnValue({ user: null });

      render(<EmailPreferences />);

      expect(
        screen.getByText("Please log in to manage your email preferences.")
      ).toBeInTheDocument();
    });

    it("shows loading state initially", () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockGetDoc.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<EmailPreferences />);

      expect(
        screen.getByText("Loading your preferences...")
      ).toBeInTheDocument();
    });
  });

  describe("Preference Loading", () => {
    it("loads user preferences from Firestore", async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          emailPreferences: {
            weeklyUpdates: false,
            announcements: true,
            frequency: "monthly",
          },
        }),
      } as any);

      render(<EmailPreferences />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("monthly")).toBeInTheDocument();
      });

      // Check that toggles reflect loaded preferences
      const weeklyUpdatesToggle = screen.getByLabelText(
        "Weekly Progress Updates"
      );
      expect(weeklyUpdatesToggle).not.toBeChecked();

      const announcementsToggle = screen.getByLabelText("Announcements");
      expect(announcementsToggle).toBeChecked();
    });

    it("uses default preferences when user document does not exist", async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      } as any);

      render(<EmailPreferences />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("weekly")).toBeInTheDocument();
      });

      const weeklyUpdatesToggle = screen.getByLabelText(
        "Weekly Progress Updates"
      );
      expect(weeklyUpdatesToggle).toBeChecked();
    });

    it("handles loading errors gracefully", async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockGetDoc.mockRejectedValue(new Error("Firestore error"));

      render(<EmailPreferences />);

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to load preferences/)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Preference Updates", () => {
    beforeEach(async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ emailPreferences: defaultPreferences }),
      } as any);
    });

    it("enables save button when preferences change", async () => {
      render(<EmailPreferences />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("weekly")).toBeInTheDocument();
      });

      const saveButton = screen.getByText("Save Preferences");
      expect(saveButton).toBeDisabled();

      // Change a preference
      const weeklyUpdatesToggle = screen.getByLabelText(
        "Weekly Progress Updates"
      );
      fireEvent.click(weeklyUpdatesToggle);

      expect(saveButton).not.toBeDisabled();
    });

    it("disables all preferences when unsubscribe all is selected", async () => {
      render(<EmailPreferences />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("weekly")).toBeInTheDocument();
      });

      const unsubscribeAllToggle = screen.getByLabelText(
        "Unsubscribe from all emails"
      );
      fireEvent.click(unsubscribeAllToggle);

      // Check that all other toggles are now disabled and unchecked
      const weeklyUpdatesToggle = screen.getByLabelText(
        "Weekly Progress Updates"
      );
      expect(weeklyUpdatesToggle).toBeDisabled();
      expect(weeklyUpdatesToggle).not.toBeChecked();

      const announcementsToggle = screen.getByLabelText("Announcements");
      expect(announcementsToggle).toBeDisabled();
      expect(announcementsToggle).not.toBeChecked();
    });

    it("re-enables unsubscribe all when any preference is enabled", async () => {
      render(<EmailPreferences />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("weekly")).toBeInTheDocument();
      });

      // First unsubscribe from all
      const unsubscribeAllToggle = screen.getByLabelText(
        "Unsubscribe from all emails"
      );
      fireEvent.click(unsubscribeAllToggle);

      expect(unsubscribeAllToggle).toBeChecked();

      // Then enable a preference
      const weeklyUpdatesToggle = screen.getByLabelText(
        "Weekly Progress Updates"
      );
      fireEvent.click(weeklyUpdatesToggle);

      expect(unsubscribeAllToggle).not.toBeChecked();
      expect(weeklyUpdatesToggle).toBeChecked();
    });

    it("updates frequency preference", async () => {
      render(<EmailPreferences />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("weekly")).toBeInTheDocument();
      });

      const frequencySelect = screen.getByDisplayValue("weekly");
      fireEvent.change(frequencySelect, { target: { value: "monthly" } });

      expect(screen.getByDisplayValue("monthly")).toBeInTheDocument();

      const saveButton = screen.getByText("Save Preferences");
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe("Save Functionality", () => {
    beforeEach(async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ emailPreferences: defaultPreferences }),
      } as any);
    });

    it("saves preferences successfully", async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      render(<EmailPreferences />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("weekly")).toBeInTheDocument();
      });

      // Make a change
      const weeklyUpdatesToggle = screen.getByLabelText(
        "Weekly Progress Updates"
      );
      fireEvent.click(weeklyUpdatesToggle);

      // Save
      const saveButton = screen.getByText("Save Preferences");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Email preferences saved successfully!/)
        ).toBeInTheDocument();
      });

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(), // doc reference
        expect.objectContaining({
          emailPreferences: expect.objectContaining({
            weeklyUpdates: false,
          }),
          lastUpdated: expect.any(Date),
        })
      );
    });

    it("handles save errors", async () => {
      mockUpdateDoc.mockRejectedValue(new Error("Save failed"));

      render(<EmailPreferences />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("weekly")).toBeInTheDocument();
      });

      // Make a change
      const weeklyUpdatesToggle = screen.getByLabelText(
        "Weekly Progress Updates"
      );
      fireEvent.click(weeklyUpdatesToggle);

      // Save
      const saveButton = screen.getByText("Save Preferences");
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to save preferences/)
        ).toBeInTheDocument();
      });
    });

    it("shows saving state during save operation", async () => {
      let resolveUpdate: () => void;
      mockUpdateDoc.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveUpdate = resolve;
          })
      );

      render(<EmailPreferences />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("weekly")).toBeInTheDocument();
      });

      // Make a change
      const weeklyUpdatesToggle = screen.getByLabelText(
        "Weekly Progress Updates"
      );
      fireEvent.click(weeklyUpdatesToggle);

      // Save
      const saveButton = screen.getByText("Save Preferences");
      fireEvent.click(saveButton);

      expect(screen.getByText("Saving...")).toBeInTheDocument();
      expect(saveButton).toBeDisabled();

      // Complete the save
      resolveUpdate!();
      await waitFor(() => {
        expect(
          screen.getByText(/Email preferences saved successfully!/)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Reset Functionality", () => {
    beforeEach(async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          emailPreferences: {
            weeklyUpdates: false,
            announcements: false,
            frequency: "monthly",
          },
        }),
      });
    });

    it("resets preferences to defaults", async () => {
      render(<EmailPreferences />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("monthly")).toBeInTheDocument();
      });

      // Verify non-default state
      const weeklyUpdatesToggle = screen.getByLabelText(
        "Weekly Progress Updates"
      );
      expect(weeklyUpdatesToggle).not.toBeChecked();

      // Reset
      const resetButton = screen.getByText("Reset to Defaults");
      fireEvent.click(resetButton);

      // Verify default state
      expect(weeklyUpdatesToggle).toBeChecked();
      expect(screen.getByDisplayValue("weekly")).toBeInTheDocument();

      // Save button should be enabled
      const saveButton = screen.getByText("Save Preferences");
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe("Email Verification Status", () => {
    it("shows verified status when email is verified", async () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, customEmailVerified: true },
      });
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ emailPreferences: defaultPreferences }),
      } as any);

      render(<EmailPreferences />);

      await waitFor(() => {
        expect(
          screen.getByText("✅ Your email is verified")
        ).toBeInTheDocument();
      });
    });

    it("shows unverified status when email is not verified", async () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, customEmailVerified: false },
      });
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ emailPreferences: defaultPreferences }),
      } as any);

      render(<EmailPreferences />);

      await waitFor(() => {
        expect(screen.getByText(/Email not verified/)).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    beforeEach(async () => {
      mockUseAuth.mockReturnValue({ user: mockUser });
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ emailPreferences: defaultPreferences }),
      });
    });

    it("has proper labels for all form controls", async () => {
      render(<EmailPreferences />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("weekly")).toBeInTheDocument();
      });

      // Check that all toggles have proper labels
      expect(
        screen.getByLabelText("Weekly Progress Updates")
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Goal Reminders")).toBeInTheDocument();
      expect(screen.getByLabelText("Coaching Notes")).toBeInTheDocument();
      expect(screen.getByLabelText("Announcements")).toBeInTheDocument();
      expect(screen.getByLabelText("Marketing Emails")).toBeInTheDocument();
      expect(
        screen.getByLabelText("Unsubscribe from all emails")
      ).toBeInTheDocument();
    });

    it("disables form controls appropriately", async () => {
      render(<EmailPreferences />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("weekly")).toBeInTheDocument();
      });

      // When unsubscribe all is checked, other controls should be disabled
      const unsubscribeAllToggle = screen.getByLabelText(
        "Unsubscribe from all emails"
      );
      fireEvent.click(unsubscribeAllToggle);

      const frequencySelect = screen.getByDisplayValue("weekly");
      expect(frequencySelect).toBeDisabled();
    });
  });
});
