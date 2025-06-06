require("whatwg-fetch");
require("@testing-library/jest-dom");

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
