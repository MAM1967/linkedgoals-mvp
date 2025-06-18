/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import EmailAnalyticsDashboard from "../EmailAnalyticsDashboard";
import { useAuth } from "../../hooks/useAuth";

// Mock the useAuth hook
jest.mock("../../hooks/useAuth");
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock fetch globally
global.fetch = jest.fn();

// Mock user data generator
const createMockUser = (overrides = {}) => ({
  uid: "test-user-id",
  email: "admin@linkedgoals.app",
  getIdToken: jest.fn().mockResolvedValue("mock-token"),
  ...overrides,
});

// Mock email stats data generator
const createMockEmailStats = (overrides = {}) => ({
  total: 100,
  sent: 95,
  failed: 3,
  pending: 2,
  byType: {
    verification: { total: 50, sent: 48, failed: 1, pending: 1 },
    weekly_update: { total: 30, sent: 30, failed: 0, pending: 0 },
    announcement: { total: 15, sent: 13, failed: 2, pending: 0 },
    system: { total: 5, sent: 4, failed: 0, pending: 1 },
  },
  ...overrides,
});

describe("EmailAnalyticsDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe("Authentication States", () => {
    it("should not fetch data when user is not authenticated", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        loading: false,
        authError: null,
      } as any);

      render(<EmailAnalyticsDashboard />);

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should show loading state initially", () => {
      mockUseAuth.mockReturnValue({
        user: createMockUser(),
        loading: false,
        authError: null,
      } as any);

      render(<EmailAnalyticsDashboard />);

      expect(
        screen.getByText("Loading email statistics...")
      ).toBeInTheDocument();
      expect(screen.getByText("Email Analytics")).toBeInTheDocument();
    });
  });

  describe("API Integration", () => {
    it("should fetch email stats when user is authenticated", async () => {
      const mockUser = createMockUser();
      const mockStats = createMockEmailStats();

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        authError: null,
      } as any);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          stats: mockStats,
        }),
      });

      render(<EmailAnalyticsDashboard />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "https://us-central1-linkedgoals-d7053.cloudfunctions.net/getEmailStats",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer mock-token",
            },
            body: JSON.stringify({ data: { days: 30 } }),
          }
        );
      });
    });

    it("should handle API errors gracefully", async () => {
      const mockUser = createMockUser();

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        authError: null,
      } as any);

      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network error")
      );

      render(<EmailAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Error: Network error")).toBeInTheDocument();
      });

      expect(screen.getByText("Retry")).toBeInTheDocument();
    });

    it("should handle API response errors", async () => {
      const mockUser = createMockUser();

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        authError: null,
      } as any);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

      render(<EmailAnalyticsDashboard />);

      await waitFor(() => {
        expect(
          screen.getByText(/Failed to fetch email statistics/)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Data Display", () => {
    beforeEach(async () => {
      const mockUser = createMockUser();
      const mockStats = createMockEmailStats();

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        authError: null,
      } as any);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          stats: mockStats,
        }),
      });
    });

    it("should display overview statistics correctly", async () => {
      render(<EmailAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText("100")).toBeInTheDocument(); // Total emails
        expect(screen.getByText("95")).toBeInTheDocument(); // Sent emails
        expect(screen.getByText("3")).toBeInTheDocument(); // Failed emails
        expect(screen.getByText("2")).toBeInTheDocument(); // Pending emails
      });

      expect(screen.getByText("95% success rate")).toBeInTheDocument();
    });

    it("should display email types breakdown", async () => {
      render(<EmailAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText("VERIFICATION")).toBeInTheDocument();
        expect(screen.getByText("WEEKLY UPDATE")).toBeInTheDocument();
        expect(screen.getByText("ANNOUNCEMENT")).toBeInTheDocument();
        expect(screen.getByText("SYSTEM")).toBeInTheDocument();
      });

      // Check individual type stats
      expect(screen.getByText("Sent: 48")).toBeInTheDocument();
      expect(screen.getByText("Sent: 30")).toBeInTheDocument();
    });

    it("should display performance summary", async () => {
      render(<EmailAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Overall Health")).toBeInTheDocument();
        expect(screen.getByText("Most Active Email Type")).toBeInTheDocument();
        expect(screen.getByText("Action Items")).toBeInTheDocument();
      });

      expect(screen.getByText("🟢 Excellent")).toBeInTheDocument(); // 95% success rate
    });

    it("should calculate success rates correctly", async () => {
      render(<EmailAnalyticsDashboard />);

      await waitFor(() => {
        // Verification: 48/50 = 96%
        expect(screen.getByText("Success Rate: 96%")).toBeInTheDocument();
        // Weekly Update: 30/30 = 100%
        expect(screen.getByText("Success Rate: 100%")).toBeInTheDocument();
      });
    });
  });

  describe("User Interactions", () => {
    it("should change time range when selection changes", async () => {
      const mockUser = createMockUser();
      const mockStats = createMockEmailStats();

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        authError: null,
      } as any);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          stats: mockStats,
        }),
      });

      render(<EmailAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Last 30 days")).toBeInTheDocument();
      });

      // Change time range to 7 days
      const select = screen.getByDisplayValue("Last 30 days");
      fireEvent.change(select, { target: { value: "7" } });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            body: JSON.stringify({ data: { days: 7 } }),
          })
        );
      });
    });

    it("should retry data fetching when retry button is clicked", async () => {
      const mockUser = createMockUser();

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        authError: null,
      } as any);

      // First call fails
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            stats: createMockEmailStats(),
          }),
        });

      render(<EmailAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText("Error: Network error")).toBeInTheDocument();
      });

      // Click retry
      fireEvent.click(screen.getByText("Retry"));

      await waitFor(() => {
        expect(screen.getByText("100")).toBeInTheDocument(); // Data loaded
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should refresh data when refresh button is clicked", async () => {
      const mockUser = createMockUser();
      const mockStats = createMockEmailStats();

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        authError: null,
      } as any);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          stats: mockStats,
        }),
      });

      render(<EmailAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText("100")).toBeInTheDocument();
      });

      // Click refresh
      fireEvent.click(screen.getByText("🔄 Refresh Data"));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty stats data", async () => {
      const mockUser = createMockUser();

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        authError: null,
      } as any);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          stats: null,
        }),
      });

      render(<EmailAnalyticsDashboard />);

      await waitFor(() => {
        expect(
          screen.getByText("No email statistics available")
        ).toBeInTheDocument();
      });
    });

    it("should handle zero totals for success rate calculation", async () => {
      const mockUser = createMockUser();
      const mockStats = createMockEmailStats({
        total: 0,
        sent: 0,
        failed: 0,
        pending: 0,
        byType: {
          verification: { total: 0, sent: 0, failed: 0, pending: 0 },
        },
      });

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        authError: null,
      } as any);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          stats: mockStats,
        }),
      });

      render(<EmailAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText("0% success rate")).toBeInTheDocument();
      });
    });

    it("should display correct health status for poor performance", async () => {
      const mockUser = createMockUser();
      const mockStats = createMockEmailStats({
        total: 100,
        sent: 70, // 70% success rate - "poor"
        failed: 30,
        pending: 0,
      });

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        authError: null,
      } as any);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          stats: mockStats,
        }),
      });

      render(<EmailAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByText("🔴 Needs Attention")).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels and structure", async () => {
      const mockUser = createMockUser();
      const mockStats = createMockEmailStats();

      mockUseAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        authError: null,
      } as any);

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          stats: mockStats,
        }),
      });

      render(<EmailAnalyticsDashboard />);

      await waitFor(() => {
        expect(screen.getByLabelText("Time Range:")).toBeInTheDocument();
      });

      // Check headings hierarchy
      expect(
        screen.getByRole("heading", { name: "Email Analytics" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Email Types Breakdown" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Performance Summary" })
      ).toBeInTheDocument();
    });
  });
});
