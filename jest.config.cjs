module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  // Performance optimization: automatically clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // TypeScript optimization for faster test execution (modern config)
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        // Disable type checking during tests for speed
        isolatedModules: true,
        tsconfig: {
          skipLibCheck: true,
          isolatedModules: true,
        },
      },
    ],
  },

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(svg)$": "<rootDir>/src/__mocks__/fileMock.js",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}",
    "<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  transformIgnorePatterns: [
    "node_modules/(?!(react-router|@remix-run|react-router-dom|jose|jwks-rsa|firebase|@firebase)/)",
  ],
  modulePathIgnorePatterns: [
    "<rootDir>/myapp-lg/",
    "<rootDir>/frontend/",
    "<rootDir>/dist/",
  ],
  extensionsToTreatAsEsm: [".ts", ".tsx"],

  // Optimize test execution
  maxWorkers: "50%",
  testTimeout: 10000,

  // Better error reporting
  verbose: false,
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "functions/src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/vite-env.d.ts",
    "!src/main.tsx",
  ],
};
