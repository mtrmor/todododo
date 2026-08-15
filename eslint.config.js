const { defineConfig, globalIgnores } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

const moduleNames = ["auth", "sidebar", "task-list", "search", "task-detail", "placeholder-screen"];
const moduleBoundaryRules = moduleNames.map((moduleName) => ({
  files: [`src/modules/${moduleName}/**/*.{ts,tsx}`],
  ignores: [`src/modules/${moduleName}/**/*-controller.ts`],
  rules: {
    "no-restricted-imports": ["error", {
      paths: [
        {
          name: "react",
          importNames: ["useSyncExternalStore"],
          message: "UI modules must use domain hooks from Shared State.",
        },
      ],
      patterns: moduleNames.filter((candidate) => candidate !== moduleName).map((candidate) => ({
        group: [`@/modules/${candidate}`, `@/modules/${candidate}/**`],
        message: "UI modules must communicate through Core or Shared State.",
      })).concat({
        group: [
          "@/shared-state/internal",
          "@/shared-state/internal/**",
          "@/shared-state/external-store",
          "@/shared-state/tasks-store",
          "@/shared-state/ui-store",
          "@/shared-state/broadcast-bridge",
        ],
        message: "Only module controllers may access internal Shared State.",
      }),
    }],
  },
}));
const moduleControllerBoundaryRules = moduleNames.map((moduleName) => ({
  files: [`src/modules/${moduleName}/**/*-controller.ts`],
  rules: {
    "no-restricted-imports": ["error", {
      paths: [{
        name: "react",
        importNames: ["useSyncExternalStore"],
        message: "Controllers are framework-independent and never subscribe through React.",
      }],
      patterns: moduleNames.filter((candidate) => candidate !== moduleName).map((candidate) => ({
        group: [`@/modules/${candidate}`, `@/modules/${candidate}/**`],
        message: "Module controllers must remain private to their own module.",
      })),
    }],
  },
}));

module.exports = defineConfig([
  globalIgnores(["dist/**", ".expo/**", "coverage/**", "node_modules/**", "supabase/.temp/**"]),
  expoConfig,
  {
    files: ["src/core/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [
        {
          group: ["@/modules", "@/modules/**"],
          message: "Core and Shared State must never import UI modules.",
        },
        {
          group: ["@/root", "@/root/**"],
          message: "Core must not depend on the Root layer.",
        },
        {
          group: ["@/shared-state", "@/shared-state/**"],
          message: "Core must not depend on Shared State.",
        },
      ]}],
    },
  },
  {
    files: ["src/root/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [{
        group: ["@/modules", "@/modules/**"],
        message: "Root providers and shared UI must not depend on visible modules.",
      }]}],
    },
  },
  {
    files: ["src/shared-state/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [
        {
          group: ["@/core", "@/core/**", "@supabase/**", "*powersync*", "*sqlite*"],
          message: "Shared State contains passive synchronous stores and cannot access Core or data clients.",
        },
        {
          group: ["@/modules", "@/modules/**"],
          message: "Shared State must never import UI modules.",
        },
      ]}],
    },
  },
  ...moduleBoundaryRules,
  ...moduleControllerBoundaryRules,
]);
