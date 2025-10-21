import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  extensionsToTreatAsEsm: [".ts"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.setup.ts"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.json",
        useESM: true
      }
    ]
  },
  moduleNameMapper: {
    "^@paralleldrive/cuid2$": "<rootDir>/tests/mocks/cuid2.cjs",
    "^ioredis$": "<rootDir>/tests/mocks/ioredis.ts"
  },
  collectCoverageFrom: ["src/**/*.ts", "!src/**/index.ts", "!src/**/types/**"],
  coverageDirectory: "coverage",
  reporters: ["default"],
  forceExit: true,
  clearMocks: true,
};

export default config;
