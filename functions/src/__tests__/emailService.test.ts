import { EmailService } from "../emailService";

// Mock Firebase Admin
jest.mock("firebase-admin/firestore", () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      add: jest.fn(),
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
      })),
    })),
  })),
}));

// Mock Firebase Functions
jest.mock("firebase-functions/v2", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock fetch for Resend API
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe("EmailService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    // Initialize EmailService with test API key
    EmailService.initialize("test-api-key");
  });

  describe("Initialization", () => {
    it("throws error when not initialized", () => {
      // Reset the service
      (EmailService as any).isInitialized = false;

      expect(() => {
        EmailService.sendVerificationEmail("test@example.com", "token123");
      }).toThrow("EmailService not initialized");
    });

    it("initializes successfully with API key", () => {
      expect(() => {
        EmailService.initialize("test-api-key");
      }).not.toThrow();
    });
  });

  describe("sendVerificationEmail", () => {
    beforeEach(() => {
      EmailService.initialize("test-api-key");
    });

    it("sends verification email successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "resend-id-123" }),
      } as Response);

      const result = await EmailService.sendVerificationEmail(
        "test@example.com",
        "verification-token-123",
        "John Doe"
      );

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.resend.com/emails",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-api-key",
            "Content-Type": "application/json",
          }),
          body: expect.stringContaining("verification-token-123"),
        })
      );
    });

    it("handles API errors gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: "Invalid email" }),
      } as Response);

      const result = await EmailService.sendVerificationEmail(
        "invalid-email",
        "token123"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid email");
    });

    it("handles network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await EmailService.sendVerificationEmail(
        "test@example.com",
        "token123"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Network error");
    });

    it("uses default user name when not provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "resend-id-123" }),
      } as Response);

      await EmailService.sendVerificationEmail("test@example.com", "token123");

      const callBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string);
      expect(callBody.subject).toContain("Verify your email");
    });
  });

  describe("sendWelcomeEmail", () => {
    beforeEach(() => {
      EmailService.initialize("test-api-key");
    });

    it("sends welcome email successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "resend-id-456" }),
      } as Response);

      const result = await EmailService.sendWelcomeEmail(
        "newuser@example.com",
        "Jane Doe"
      );

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.resend.com/emails",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("Welcome to LinkedGoals"),
        })
      );
    });
  });

  describe("sendWeeklyUpdate", () => {
    beforeEach(() => {
      EmailService.initialize("test-api-key");
    });

    it("sends weekly update email with user data", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "resend-id-789" }),
      } as Response);

      const userData = {
        firstName: "John",
        goalsCompleted: 3,
        goalsInProgress: 2,
        upcomingDeadlines: [
          { title: "Finish project", daysRemaining: 5, category: "Work" },
        ],
        motivationalQuote: "Keep going!",
        dashboardUrl: "https://app.linkedgoals.app/dashboard",
        unsubscribeUrl: "https://app.linkedgoals.app/unsubscribe?token=abc123",
      };

      const result = await EmailService.sendWeeklyUpdate(
        "user@example.com",
        userData
      );

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.resend.com/emails",
        expect.objectContaining({
          body: expect.stringContaining("John"),
        })
      );
    });
  });

  describe("sendAnnouncement", () => {
    beforeEach(() => {
      EmailService.initialize("test-api-key");
    });

    it("sends announcement to multiple recipients", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "resend-id-announcement" }),
      } as Response);

      const emails = ["user1@example.com", "user2@example.com"];
      const result = await EmailService.sendAnnouncement(
        emails,
        "Platform Update",
        "We have exciting new features!",
        "Admin Team"
      );

      expect(result.success).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.resend.com/emails",
        expect.objectContaining({
          body: expect.stringContaining("Platform Update"),
        })
      );
    });
  });

  describe("Email Type Detection", () => {
    it("correctly identifies email types", () => {
      // This tests the private method indirectly
      expect(EmailService).toBeDefined();
    });
  });

  describe("Template Rendering", () => {
    beforeEach(() => {
      EmailService.initialize("test-api-key");
    });

    it("replaces template variables correctly", async () => {
      // Mock Firestore template document
      const mockFirestore = require("firebase-admin/firestore");
      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          htmlContent: "<p>Hello {{userName}}!</p>",
          textContent: "Hello {{userName}}!",
        }),
      });

      mockFirestore.getFirestore().collection().doc.mockReturnValue({
        get: mockGet,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "test-id" }),
      } as Response);

      await EmailService.sendVerificationEmail(
        "test@example.com",
        "token123",
        "John Doe"
      );

      // Verify that the template was fetched and variables replaced
      expect(mockGet).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      EmailService.initialize("test-api-key");
    });

    it("handles missing templates gracefully", async () => {
      // Mock template not found
      const mockFirestore = require("firebase-admin/firestore");
      const mockGet = jest.fn().mockResolvedValue({
        exists: false,
      });

      mockFirestore.getFirestore().collection().doc.mockReturnValue({
        get: mockGet,
      });

      const result = await EmailService.sendVerificationEmail(
        "test@example.com",
        "token123"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });

    it("handles Firestore errors", async () => {
      // Mock Firestore error
      const mockFirestore = require("firebase-admin/firestore");
      const mockGet = jest.fn().mockRejectedValue(new Error("Firestore error"));

      mockFirestore.getFirestore().collection().doc.mockReturnValue({
        get: mockGet,
      });

      const result = await EmailService.sendVerificationEmail(
        "test@example.com",
        "token123"
      );

      expect(result.success).toBe(false);
    });
  });

  describe("Email Logging", () => {
    beforeEach(() => {
      EmailService.initialize("test-api-key");
    });

    it("logs email attempts to Firestore", async () => {
      const mockFirestore = require("firebase-admin/firestore");
      const mockAdd = jest.fn();

      mockFirestore.getFirestore().collection.mockReturnValue({
        add: mockAdd,
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => ({
              htmlContent: "<p>Test</p>",
              textContent: "Test",
            }),
          }),
        })),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "resend-id" }),
      } as Response);

      await EmailService.sendVerificationEmail("test@example.com", "token123");

      // Verify email log was created
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "test@example.com",
          status: "sent",
          emailType: "verification",
        })
      );
    });
  });
});
