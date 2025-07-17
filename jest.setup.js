require("whatwg-fetch");
require("@testing-library/jest-dom");

// Mock Firebase completely before any imports
const mockAuth = {
  currentUser: null,
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn(),
};

const mockDb = {};
const mockFunctions = {};

// Mock Firebase modules
jest.mock("firebase/app", () => ({
  initializeApp: jest.fn(() => ({ name: "mock-app" })),
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => mockAuth),
  connectAuthEmulator: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(() => mockDb),
  connectFirestoreEmulator: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ seconds: Date.now() / 1000 })),
    fromDate: jest.fn(),
  },
  orderBy: jest.fn(),
  limit: jest.fn(),
  startAfter: jest.fn(),
  collectionGroup: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  onSnapshot: jest.fn((docRef, callback) => {
    // Simulate document snapshot
    const mockSnapshot = {
      exists: () => true,
      data: () => ({}),
      id: "mock-doc-id",
    };
    callback(mockSnapshot);
    // Return unsubscribe function
    return jest.fn();
  }),
}));

jest.mock("firebase/functions", () => ({
  getFunctions: jest.fn(() => mockFunctions),
  httpsCallable: jest.fn(),
}));

// Mock Vite's import.meta.env for all tests
global.import = {
  meta: {
    env: {
      VITE_LINKEDIN_CLIENT_ID: "test-client-id",
      VITE_LINKEDIN_REDIRECT_URI: "http://localhost:3000/linkedin-callback",
      // Add other environment variables as needed
    },
  },
};

// Mock TextEncoder/TextDecoder for react-router
if (typeof TextEncoder === "undefined") {
  global.TextEncoder = require("util").TextEncoder;
}
if (typeof TextDecoder === "undefined") {
  global.TextDecoder = require("util").TextDecoder;
}

// Mock window.location
Object.defineProperty(window, "location", {
  value: {
    assign: jest.fn(),
    search: "",
    pathname: "/",
    hash: "",
    host: "localhost:3000",
    hostname: "localhost",
    href: "http://localhost:3000",
    origin: "http://localhost:3000",
    port: "3000",
    protocol: "http:",
  },
  writable: true,
});
