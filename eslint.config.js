const { defineConfig, globalIgnores } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

const moduleNames = ["auth", "sidebar", "task-list", "search", "task-detail", "placeholder-screen"];
const moduleBoundaryRules = moduleNames.map((moduleName) => ({
  files: [`src/modules/${moduleName}/**/*.{ts,tsx}`],
  rules: {
    "no-restricted-imports": ["error", {
      patterns: moduleNames.filter((candidate) => candidate !== moduleName).map((candidate) => ({
        group: [`@/modules/${candidate}`, `@/modules/${candidate}/**`],
        message: "UI modules must communicate through Core or Shared State.",
      })),
    }],
  },
}));

module.exports = defineConfig([
  globalIgnores(["dist/**", ".expo/**", "coverage/**", "node_modules/**", "supabase/.temp/**"]),
  expoConfig,
  {
    files: ["src/core/**/*.{ts,tsx}", "src/shared-state/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [{
        group: ["@/modules", "@/modules/**"],
        message: "Core and Shared State must never import UI modules.",
      }]}],
    },
  },
  {
    files: ["src/shared-state/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [
        {
          group: ["@/core", "@/core/**", "@supabase/**", "*powersync*", "*sqlite*"],
          message: "Shared State is a synchronous UI bus and cannot access Core or data clients.",
        },
        {
          group: ["@/modules", "@/modules/**"],
          message: "Shared State must never import UI modules.",
        },
      ]}],
    },
  },
  ...moduleBoundaryRules,
]);
