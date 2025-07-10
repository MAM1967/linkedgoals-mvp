/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import EmailPreferences from "../EmailPreferences";

// Mock setup following TypeScript testing best practices
jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
}));

jest.mock("../../lib/firebase", () => ({
  db: {},
}));

jest.mock("../../hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

import { getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "../../hooks/useAuth";

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;

// Simple test data generators
const createMockUser = (emailVerified = true) =>
  ({
    uid: "test-user",
    email: "test@example.com",
    customEmailVerified: emailVerified,
  } as any);

const createAuthState = (user: any = null, loading = false) => ({
  user,
  loading,
});

describe("EmailPreferences - Simplified", () => {
  beforeEach(() => {
    // Mocks auto-cleared due to clearMocks: true in Jest config
  });

  describe("Authentication and Loading States", () => {
    it("shows login message when not authenticated", () => {
      mockUseAuth.mockReturnValue(createAuthState());

      render(<EmailPreferences />);

      expect(screen.getByText(/log in to manage/i)).toBeInTheDocument();
    });

    it("shows loading state", () => {
      mockUseAuth.mockReturnValue(createAuthState(createMockUser()));
      mockGetDoc.mockImplementation(() => new Promise(() => {}));

      render(<EmailPreferences />);

      expect(screen.getByText(/loading your preferences/i)).toBeInTheDocument();
    });
  });

  describe("Preference Management", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue(createAuthState(createMockUser()));
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          emailPreferences: {
            weeklyUpdates: true,
            announcements: true,
            frequency: "weekly",
          },
        }),
      } as any);
    });

    it("displays loaded preferences", async () => {
      render(<EmailPreferences />);

      await waitFor(() => {
        const frequencySelect = screen.getByRole("combobox");
        expect(frequencySelect).toBeInTheDocument();
        expect(frequencySelect).toHaveValue("weekly");
      });

      // Find checkboxes by their position since they're in custom switch components
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes[0]).toBeChecked(); // Weekly Progress Updates checkbox
    });

    it("enables save button when preferences change", async () => {
      render(<EmailPreferences />);

      await waitFor(() => {
        const frequencySelect = screen.getByRole("combobox");
        expect(frequencySelect).toHaveValue("weekly");
      });

      const saveButton = screen.getByText(/save preferences/i);
      expect(saveButton).toBeDisabled();

      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[0]); // Weekly Progress Updates checkbox
      expect(saveButton).not.toBeDisabled();
    });

    it("handles unsubscribe all functionality", async () => {
      render(<EmailPreferences />);

      await waitFor(() => {
        const frequencySelect = screen.getByRole("combobox");
        expect(frequencySelect).toHaveValue("weekly");
      });

      const checkboxes = screen.getAllByRole("checkbox");
      const unsubscribeToggle = checkboxes[checkboxes.length - 1]; // Last checkbox is "unsubscribe from all"
      fireEvent.click(unsubscribeToggle);

      // After unsubscribe all, weekly updates checkbox should be disabled and unchecked
      const weeklyToggle = checkboxes[0]; // First checkbox is "Weekly Progress Updates"
      expect(weeklyToggle).toBeDisabled();
      expect(weeklyToggle).not.toBeChecked();
    });
  });

  describe("Save Functionality", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue(createAuthState(createMockUser()));
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({
          emailPreferences: { weeklyUpdates: true, frequency: "weekly" },
        }),
      } as any);
      mockUpdateDoc.mockResolvedValue(undefined as any);
    });

    it("saves preferences successfully", async () => {
      render(<EmailPreferences />);

      await waitFor(() => {
        const frequencySelect = screen.getByRole("combobox");
        expect(frequencySelect).toHaveValue("weekly");
      });

      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[0]); // Weekly Progress Updates checkbox
      fireEvent.click(screen.getByText(/save preferences/i));

      await waitFor(() => {
        expect(screen.getByText(/saved successfully/i)).toBeInTheDocument();
      });

      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it("handles save errors", async () => {
      mockUpdateDoc.mockRejectedValue(new Error("Save failed"));

      render(<EmailPreferences />);

      await waitFor(() => {
        const frequencySelect = screen.getByRole("combobox");
        expect(frequencySelect).toHaveValue("weekly");
      });

      const checkboxes = screen.getAllByRole("checkbox");
      fireEvent.click(checkboxes[0]); // Weekly Progress Updates checkbox
      fireEvent.click(screen.getByText(/save preferences/i));

      await waitFor(() => {
        expect(screen.getByText(/failed to save/i)).toBeInTheDocument();
      });
    });
  });

  describe("Email Verification Status", () => {
    it("shows verified status", async () => {
      mockUseAuth.mockReturnValue(createAuthState(createMockUser(true)));
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ emailPreferences: {} }),
      } as any);

      render(<EmailPreferences />);

      await waitFor(() => {
        expect(screen.getByText(/email is verified/i)).toBeInTheDocument();
      });
    });

    it("shows unverified status", async () => {
      mockUseAuth.mockReturnValue(createAuthState(createMockUser(false)));
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ emailPreferences: {} }),
      } as any);

      render(<EmailPreferences />);

      await waitFor(() => {
        expect(screen.getByText(/email not verified/i)).toBeInTheDocument();
      });
    });
  });
});
