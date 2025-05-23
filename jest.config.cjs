module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
  roots: ["<rootDir>/src"],
  moduleDirectories: ["node_modules", "<rootDir>/src"],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^@components/(.*)$": "<rootDir>/src/components/$1",
    "^@lib/(.*)$": "<rootDir>/src/lib/$1",
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  clearMocks: true,
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[tj]s?(x)"],
  modulePathIgnorePatterns: [
    "<rootDir>/functions/package.json",
    "<rootDir>/myapp-lg/package.json",
    "<rootDir>/frontend/package.json",
    "<rootDir>/dist/",
  ],
};
