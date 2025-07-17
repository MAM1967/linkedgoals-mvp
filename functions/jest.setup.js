// Mock Firebase Admin SDK
jest.mock("firebase-admin", () => ({
  initializeApp: jest.fn(),
  apps: [],
}));

jest.mock("firebase-admin/firestore", () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      add: jest.fn(),
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
      where: jest.fn(),
      orderBy: jest.fn(),
      limit: jest.fn(),
      get: jest.fn(),
    })),
    doc: jest.fn(() => ({
      get: jest.fn(),
      set: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
  })),
  Timestamp: {
    now: jest.fn(() => ({ seconds: Date.now() / 1000 })),
    fromDate: jest.fn(),
  },
}));

jest.mock("firebase-functions/v1", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
  https: {
    onCall: jest.fn(),
    onRequest: jest.fn(),
  },
  auth: {
    user: jest.fn(() => ({
      onCreate: jest.fn(),
      onDelete: jest.fn(),
    })),
  },
}));

// Mock Resend
jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn(),
    },
  })),
}));

// Mock environment variables
process.env.RESEND_API_KEY = "test-api-key";
process.env.FIREBASE_CONFIG = JSON.stringify({
  projectId: "test-project",
  databaseURL: "https://test-project.firebaseio.com",
});