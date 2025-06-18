import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { SafeEmailVerificationBanner } from "../SafeEmailVerificationBanner";
import { useAuth } from "../../hooks/useAuth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

// Mock Firebase
jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  onSnapshot: jest.fn(),
}));

jest.mock("../../hooks/useAuth");
jest.mock("../../lib/firebase", () => ({
  db: {},
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockDoc = doc as jest.MockedFunction<typeof doc>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockOnSnapshot = onSnapshot as jest.MockedFunction<typeof onSnapshot>;

const mockUser = {
  uid: "test-user-123",
  email: "test@example.com",
  emailVerified: true,
};

const mockEmailVerificationState = {
  canResend: true,
  lastSent: null,
  cooldownRemaining: 0,
};

const mockSendVerificationEmail = jest.fn();

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("SafeEmailVerificationBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn(); // Mock console.log for debug messages
    console.error = jest.fn();

    mockUseAuth.mockReturnValue({
      user: mockUser,
      emailVerificationState: mockEmailVerificationState,
      sendVerificationEmail: mockSendVerificationEmail,
    } as any);
  });

  describe("Component Rendering", () => {
    it("should not render when user is not authenticated", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        emailVerificationState: mockEmailVerificationState,
        sendVerificationEmail: mockSendVerificationEmail,
      } as any);

      renderWithRouter(<SafeEmailVerificationBanner />);

      expect(
        screen.queryByText("Please verify your email address")
      ).not.toBeInTheDocument();
    });

    it("should not render when email is already verified", () => {
      // Mock Firestore response for verified user
      const mockUnsubscribe = jest.fn();
      mockOnSnapshot.mockImplementation((docRef, callback) => {
        callback({
          exists: () => true,
          data: () => ({ verified: true, email: "test@example.com" }),
        });
        return mockUnsubscribe;
      });

      renderWithRouter(<SafeEmailVerificationBanner />);

      expect(
        screen.queryByText("Please verify your email address")
      ).not.toBeInTheDocument();
    });

    it("should render verification banner when email is not verified", async () => {
      // Mock Firestore response for unverified user
      const mockUnsubscribe = jest.fn();
      mockOnSnapshot.mockImplementation((docRef, callback) => {
        callback({
          exists: () => true,
          data: () => ({ verified: false, email: "test@example.com" }),
        });
        return mockUnsubscribe;
      });

      renderWithRouter(<SafeEmailVerificationBanner />);

      await waitFor(() => {
        expect(
          screen.getByText("Please verify your email address")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Check your inbox for a verification link")
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: "Resend" })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: "Check Status" })
        ).toBeInTheDocument();
      });
    });
  });

  describe("Real-time Listener", () => {
    it("should set up real-time listener on mount", () => {
      const mockUnsubscribe = jest.fn();
      mockOnSnapshot.mockReturnValue(mockUnsubscribe);

      renderWithRouter(<SafeEmailVerificationBanner />);

      // The listener should be called when user is available
      expect(mockOnSnapshot).toHaveBeenCalledWith(
        expect.objectContaining({
          // Firebase doc reference should be an object
        }),
        expect.any(Function), // success callback
        expect.any(Function) // error callback
      );
    });

    it("should update verification status when Firestore document changes", async () => {
      const mockUnsubscribe = jest.fn();
      let firestoreCallback: any;

      mockOnSnapshot.mockImplementation((docRef, callback, errorCallback) => {
        firestoreCallback = callback;
        return mockUnsubscribe;
      });

      renderWithRouter(<SafeEmailVerificationBanner />);

      // Simulate Firestore update - user becomes verified
      firestoreCallback({
        exists: () => true,
        data: () => ({ verified: true, email: "test@example.com" }),
      });

      await waitFor(() => {
        expect(
          screen.queryByText("Please verify your email address")
        ).not.toBeInTheDocument();
      });
    });

    it("should handle Firestore errors gracefully", async () => {
      const mockUnsubscribe = jest.fn();
      let errorCallback: any;

      mockOnSnapshot.mockImplementation((docRef, callback, onError) => {
        errorCallback = onError;
        return mockUnsubscribe;
      });

      renderWithRouter(<SafeEmailVerificationBanner />);

      // Simulate Firestore error
      const mockError = new Error("Firestore connection failed");
      errorCallback(mockError);

      expect(console.error).toHaveBeenCalledWith(
        "Error in verification listener:",
        mockError
      );
    });

    it("should cleanup listener on unmount", () => {
      const mockUnsubscribe = jest.fn();
      mockOnSnapshot.mockReturnValue(mockUnsubscribe);

      const { unmount } = renderWithRouter(<SafeEmailVerificationBanner />);

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });

  describe("Manual Refresh Functionality", () => {
    beforeEach(() => {
      // Setup unverified state
      const mockUnsubscribe = jest.fn();
      mockOnSnapshot.mockImplementation((docRef, callback) => {
        callback({
          exists: () => true,
          data: () => ({ verified: false, email: "test@example.com" }),
        });
        return mockUnsubscribe;
      });
    });

    it("should perform manual refresh when Check Status button is clicked", async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ verified: true, email: "test@example.com" }),
      } as any);

      renderWithRouter(<SafeEmailVerificationBanner />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Check Status" })
        ).toBeInTheDocument();
      });

      const checkStatusButton = screen.getByRole("button", {
        name: "Check Status",
      });
      fireEvent.click(checkStatusButton);

      expect(mockGetDoc).toHaveBeenCalled();

      await waitFor(() => {
        expect(screen.getByText("Checking...")).toBeInTheDocument();
      });
    });

    it("should handle manual refresh errors", async () => {
      const mockError = new Error("Network error");
      mockGetDoc.mockRejectedValue(mockError);

      renderWithRouter(<SafeEmailVerificationBanner />);

      await waitFor(() => {
        const checkStatusButton = screen.getByRole("button", {
          name: "Check Status",
        });
        fireEvent.click(checkStatusButton);
      });

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          "💥 Error during manual refresh:",
          mockError
        );
      });
    });

    it("should disable Check Status button during refresh", async () => {
      let resolveGetDoc: any;
      mockGetDoc.mockReturnValue(
        new Promise((resolve) => {
          resolveGetDoc = resolve;
        })
      );

      renderWithRouter(<SafeEmailVerificationBanner />);

      await waitFor(() => {
        const checkStatusButton = screen.getByRole("button", {
          name: "Check Status",
        });
        fireEvent.click(checkStatusButton);

        expect(checkStatusButton).toBeDisabled();
        expect(screen.getByText("Checking...")).toBeInTheDocument();
      });

      // Resolve the promise
      resolveGetDoc({
        exists: () => false,
      });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: "Check Status" })
        ).not.toBeDisabled();
      });
    });
  });

  describe("Email Resend Functionality", () => {
    beforeEach(() => {
      // Setup unverified state
      const mockUnsubscribe = jest.fn();
      mockOnSnapshot.mockImplementation((docRef, callback) => {
        callback({
          exists: () => true,
          data: () => ({ verified: false, email: "test@example.com" }),
        });
        return mockUnsubscribe;
      });
    });

    it("should send verification email when Resend button is clicked", async () => {
      mockSendVerificationEmail.mockResolvedValue({ success: true });

      renderWithRouter(<SafeEmailVerificationBanner />);

      await waitFor(() => {
        const resendButton = screen.getByRole("button", { name: "Resend" });
        fireEvent.click(resendButton);
      });

      expect(mockSendVerificationEmail).toHaveBeenCalled();
    });

    it("should show success message after successful email send", async () => {
      mockSendVerificationEmail.mockResolvedValue({ success: true });

      renderWithRouter(<SafeEmailVerificationBanner />);

      await waitFor(() => {
        const resendButton = screen.getByRole("button", { name: "Resend" });
        fireEvent.click(resendButton);
      });

      await waitFor(() => {
        expect(
          screen.getByText("Verification email sent! Check your inbox.")
        ).toBeInTheDocument();
      });
    });

    it("should show error message after failed email send", async () => {
      mockSendVerificationEmail.mockResolvedValue({ success: false });

      renderWithRouter(<SafeEmailVerificationBanner />);

      await waitFor(() => {
        const resendButton = screen.getByRole("button", { name: "Resend" });
        fireEvent.click(resendButton);
      });

      await waitFor(() => {
        expect(
          screen.getByText("Failed to send email. Please try again.")
        ).toBeInTheDocument();
      });
    });

    it("should disable Resend button when cooldown is active", async () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        emailVerificationState: {
          canResend: false,
          lastSent: Date.now(),
          cooldownRemaining: 30000,
        },
        sendVerificationEmail: mockSendVerificationEmail,
      } as any);

      renderWithRouter(<SafeEmailVerificationBanner />);

      await waitFor(() => {
        const resendButton = screen.getByRole("button", { name: "Resend" });
        expect(resendButton).toBeDisabled();
      });
    });
  });

  describe("URL Parameter Handling", () => {
    it("should trigger manual refresh when emailVerified parameter is present", async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ verified: true, email: "test@example.com" }),
      } as any);

      // Mock URLSearchParams to return emailVerified=true
      const mockSearchParams = new URLSearchParams("?emailVerified=true");
      jest.spyOn(URLSearchParams.prototype, "get").mockImplementation((key) => {
        return key === "emailVerified" ? "true" : null;
      });

      renderWithRouter(<SafeEmailVerificationBanner />);

      await waitFor(() => {
        expect(mockGetDoc).toHaveBeenCalled();
      });
    });
  });

  describe("Debug Logging", () => {
    it("should log banner debug information", async () => {
      const mockUnsubscribe = jest.fn();
      mockOnSnapshot.mockImplementation((docRef, callback) => {
        callback({
          exists: () => true,
          data: () => ({ verified: false, email: "test@example.com" }),
        });
        return mockUnsubscribe;
      });

      renderWithRouter(<SafeEmailVerificationBanner />);

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith(
          "Banner Debug:",
          expect.any(Object)
        );
      });
    });

    it("should log real-time listener setup", () => {
      const mockUnsubscribe = jest.fn();
      mockOnSnapshot.mockReturnValue(mockUnsubscribe);

      renderWithRouter(<SafeEmailVerificationBanner />);

      expect(console.log).toHaveBeenCalledWith(
        "Setting up real-time listener for user:",
        mockUser.uid
      );
    });
  });

  describe("Component Integration", () => {
    it("should have proper CSS classes for styling", async () => {
      const mockUnsubscribe = jest.fn();
      mockOnSnapshot.mockImplementation((docRef, callback) => {
        callback({
          exists: () => true,
          data: () => ({ verified: false, email: "test@example.com" }),
        });
        return mockUnsubscribe;
      });

      renderWithRouter(<SafeEmailVerificationBanner />);

      await waitFor(() => {
        const banner = screen
          .getByText("Please verify your email address")
          .closest(".safe-email-verification-banner");
        expect(banner).toBeInTheDocument();
        expect(banner).toHaveClass("safe-email-verification-banner");
      });
    });

    it("should have proper button classes for styling", async () => {
      const mockUnsubscribe = jest.fn();
      mockOnSnapshot.mockImplementation((docRef, callback) => {
        callback({
          exists: () => true,
          data: () => ({ verified: false, email: "test@example.com" }),
        });
        return mockUnsubscribe;
      });

      renderWithRouter(<SafeEmailVerificationBanner />);

      await waitFor(() => {
        const resendButton = screen.getByRole("button", { name: "Resend" });
        const checkStatusButton = screen.getByRole("button", {
          name: "Check Status",
        });

        expect(resendButton).toHaveClass("resend-button");
        expect(checkStatusButton).toHaveClass(
          "resend-button",
          "refresh-button"
        );
      });
    });
  });
});
