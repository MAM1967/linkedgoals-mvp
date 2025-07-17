module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  clearMocks: true,
  restoreMocks: true,
  
  // Transform TypeScript files
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          skipLibCheck: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },

  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}",
    "<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}",
  ],
  
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  
  // Don't transform node_modules for Node.js environment
  transformIgnorePatterns: [
    "node_modules/",
  ],
  
  // Setup file for functions-specific mocks
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  
  testTimeout: 10000,
  
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
  ],
};