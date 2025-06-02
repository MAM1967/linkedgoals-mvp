module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
        useESM: true,
      },
    ],
  },
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}",
    "<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json",
      useESM: true,
    },
  },
  transformIgnorePatterns: [
    "node_modules/(?!(react-router|@remix-run|react-router-dom)/)",
  ],
  modulePathIgnorePatterns: [
    "<rootDir>/functions/",
    "<rootDir>/myapp-lg/",
    "<rootDir>/frontend/",
    "<rootDir>/dist/",
  ],
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  resolver: "jest-ts-webcompat-resolver",
};
