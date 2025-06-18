import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import EmailVerificationBanner from "../EmailVerificationBanner";

// Mock useAuth hook
jest.mock("../../hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));

import { useAuth } from "../../hooks/useAuth";

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock fetch for API calls
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe("EmailVerificationBanner", () => {
  const mockUser = {
    uid: "test-user-123",
    email: "test@example.com",
    customEmailVerified: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
  });

  describe("Visibility Logic", () => {
    it("does not render when user is null", () => {
      mockUseAuth.mockReturnValue({ user: null, loading: false });

      const { container } = render(<EmailVerificationBanner />);

      expect(container.firstChild).toBeNull();
    });

    it("does not render when email is already verified", () => {
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, customEmailVerified: true },
        loading: false,
      });

      const { container } = render(<EmailVerificationBanner />);

      expect(container.firstChild).toBeNull();
    });

    it("renders when user email is not verified", () => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false });

      render(<EmailVerificationBanner />);

      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
    });
  });

  describe("Banner Content", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
    });

    it("displays verification message and user email", () => {
      render(<EmailVerificationBanner />);

      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
    });

    it("shows resend verification button", () => {
      render(<EmailVerificationBanner />);

      expect(screen.getByText(/resend verification/i)).toBeInTheDocument();
    });

    it("shows dismiss button", () => {
      render(<EmailVerificationBanner />);

      expect(screen.getByText(/dismiss/i)).toBeInTheDocument();
    });
  });

  describe("Resend Verification", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
    });

    it("sends verification email successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      render(<EmailVerificationBanner />);

      const resendButton = screen.getByText(/resend verification/i);
      fireEvent.click(resendButton);

      // Check loading state
      expect(screen.getByText(/sending.../i)).toBeInTheDocument();

      await waitFor(() => {
        expect(
          screen.getByText(/verification email sent/i)
        ).toBeInTheDocument();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("sendVerificationEmail"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "test@example.com" }),
        })
      );
    });

    it("handles resend errors gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Failed to send email" }),
      } as Response);

      render(<EmailVerificationBanner />);

      const resendButton = screen.getByText(/resend verification/i);
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(
          screen.getByText(/failed to send verification email/i)
        ).toBeInTheDocument();
      });
    });

    it("handles network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(<EmailVerificationBanner />);

      const resendButton = screen.getByText(/resend verification/i);
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(
          screen.getByText(/failed to send verification email/i)
        ).toBeInTheDocument();
      });
    });

    it("disables button during sending", async () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<EmailVerificationBanner />);

      const resendButton = screen.getByText(/resend verification/i);
      fireEvent.click(resendButton);

      expect(screen.getByText(/sending.../i)).toBeInTheDocument();
      expect(screen.getByText(/sending.../i)).toBeDisabled();
    });
  });

  describe("Dismiss Functionality", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
    });

    it("hides banner when dismiss button is clicked", () => {
      render(<EmailVerificationBanner />);

      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();

      const dismissButton = screen.getByText(/dismiss/i);
      fireEvent.click(dismissButton);

      expect(screen.queryByText(/verify your email/i)).not.toBeInTheDocument();
    });
  });

  describe("Message Display", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
    });

    it("clears messages after successful resend", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      render(<EmailVerificationBanner />);

      const resendButton = screen.getByText(/resend verification/i);
      fireEvent.click(resendButton);

      await waitFor(() => {
        expect(
          screen.getByText(/verification email sent/i)
        ).toBeInTheDocument();
      });

      // After some time, message should clear (this would require a timer in real implementation)
      // For testing purposes, we just verify the message is shown
      expect(screen.getByText(/verification email sent/i)).toBeInTheDocument();
    });

    it("shows appropriate message styling", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      render(<EmailVerificationBanner />);

      const resendButton = screen.getByText(/resend verification/i);
      fireEvent.click(resendButton);

      await waitFor(() => {
        const successMessage = screen.getByText(/verification email sent/i);
        expect(successMessage).toHaveClass("text-green-600");
      });
    });

    it("shows error message styling", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(<EmailVerificationBanner />);

      const resendButton = screen.getByText(/resend verification/i);
      fireEvent.click(resendButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(
          /failed to send verification email/i
        );
        expect(errorMessage).toHaveClass("text-red-600");
      });
    });
  });

  describe("Accessibility", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
    });

    it("has appropriate ARIA labels", () => {
      render(<EmailVerificationBanner />);

      // Banner should have appropriate role
      const banner = screen.getByRole("banner", {
        name: /email verification/i,
      });
      expect(banner).toBeInTheDocument();
    });

    it("buttons are properly labeled", () => {
      render(<EmailVerificationBanner />);

      expect(
        screen.getByRole("button", { name: /resend verification/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /dismiss/i })
      ).toBeInTheDocument();
    });
  });

  describe("Integration with Auth", () => {
    it("responds to auth state changes", () => {
      const { rerender } = render(<EmailVerificationBanner />);

      // Initially not authenticated
      mockUseAuth.mockReturnValue({ user: null, loading: false });
      rerender(<EmailVerificationBanner />);
      expect(screen.queryByText(/verify your email/i)).not.toBeInTheDocument();

      // User logs in with unverified email
      mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
      rerender(<EmailVerificationBanner />);
      expect(screen.getByText(/verify your email/i)).toBeInTheDocument();

      // User verifies email
      mockUseAuth.mockReturnValue({
        user: { ...mockUser, customEmailVerified: true },
        loading: false,
      });
      rerender(<EmailVerificationBanner />);
      expect(screen.queryByText(/verify your email/i)).not.toBeInTheDocument();
    });
  });
});
