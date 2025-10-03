export default {
  preset: "ts-jest/presets/default-esm",   // 👈 ESM + TS
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],         // 👈 treat .ts as ESM
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,                      // 👈 key for ESM
      },
    ],
  },
  testMatch: [
    "**/__tests__/**/*.?(m)[jt]s?(x)",
    "**/?(*.)+(spec|test).?(m)[jt]s?(x)",
  ],
  testPathIgnorePatterns: ["/node_modules/"],
  collectCoverage: false,
  verbose: true,
};
