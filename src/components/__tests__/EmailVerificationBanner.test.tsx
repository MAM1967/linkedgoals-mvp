/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import EmailVerificationBanner from "../EmailVerificationBanner";

// Mock setup following TypeScript testing best practices
jest.mock("../../hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from "../../hooks/useAuth";

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockFetch = jest.fn();

// Override global fetch
beforeEach(() => {
  global.fetch = mockFetch;
});

// Simple test data generators
const createMockUser = (emailVerified = false) =>
  ({
    uid: "test-user",
    email: "test@example.com",
    customEmailVerified: emailVerified,
  } as any);

const createAuthState = (user: any = null, loading = false) => ({
  user,
  loading,
});

describe("EmailVerificationBanner - Simplified", () => {
  describe("Visibility Logic", () => {
    it("hides when user is null", () => {
      mockUseAuth.mockReturnValue(createAuthState());

      const { container } = render(<EmailVerificationBanner />);

      expect(container.firstChild).toBeNull();
    });

    it("hides when email is verified", () => {
      mockUseAuth.mockReturnValue(createAuthState(createMockUser(true)));

      const { container } = render(<EmailVerificationBanner />);

      expect(container.firstChild).toBeNull();
    });

    it("shows when email needs verification", () => {
      mockUseAuth.mockReturnValue(createAuthState(createMockUser(false)));

      render(<EmailVerificationBanner />);

      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
    });
  });

  describe("Content Display", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue(createAuthState(createMockUser(false)));
    });

    it("displays verification message and buttons", () => {
      render(<EmailVerificationBanner />);

      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
      expect(screen.getByText(/check your email/i)).toBeInTheDocument();
      expect(screen.getByText("Resend Email")).toBeInTheDocument();
      expect(screen.getByText("×")).toBeInTheDocument();
    });
  });

  describe("Resend Email Functionality", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue(createAuthState(createMockUser(false)));
    });

    it("sends email successfully", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as any);

      render(<EmailVerificationBanner />);

      const resendButton = screen.getByText("Resend Email");
      fireEvent.click(resendButton);

      expect(screen.getByText(/sending/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(
          screen.getByText(/verification email sent/i)
        ).toBeInTheDocument();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("sendVerificationEmail"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "test@example.com" }),
        })
      );
    });

    it("handles send errors gracefully", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Send failed" }),
      } as any);

      render(<EmailVerificationBanner />);

      fireEvent.click(screen.getByText("Resend Email"));

      await waitFor(() => {
        expect(screen.getByText(/failed to send/i)).toBeInTheDocument();
      });
    });

    it("handles network errors", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      render(<EmailVerificationBanner />);

      fireEvent.click(screen.getByText("Resend Email"));

      await waitFor(() => {
        expect(screen.getByText(/failed to send/i)).toBeInTheDocument();
      });
    });
  });

  describe("Dismiss Functionality", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue(createAuthState(createMockUser(false)));
    });

    it("hides banner when dismissed", () => {
      render(<EmailVerificationBanner />);

      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();

      fireEvent.click(screen.getByText("×"));

      expect(screen.queryByText(/verify your email/i)).not.toBeInTheDocument();
    });
  });

  describe("Loading States", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue(createAuthState(createMockUser(false)));
    });

    it("disables button during send operation", async () => {
      mockFetch.mockImplementation(() => new Promise(() => {}));

      render(<EmailVerificationBanner />);

      const resendButton = screen.getByText("Resend Email");
      fireEvent.click(resendButton);

      const loadingButton = screen.getByText(/sending/i);
      expect(loadingButton).toBeInTheDocument();
      expect(loadingButton).toBeDisabled();
    });
  });
});
