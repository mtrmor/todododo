const { defineConfig, globalIgnores } = require("eslint/config");
const stylistic = require("@stylistic/eslint-plugin");
const expoConfig = require("eslint-config-expo/flat");

const moduleNames = ["auth", "sidebar", "task-list", "search", "task-detail", "placeholder-screen"];
const layerNames = ["app", "root", "modules", "platform", "shared-state", "domain", "server"];

// Mirrors the dependency pyramid documented in README.md and enforced by the architecture test.
const allowedLayerImports = {
  app: ["root", "modules", "platform", "shared-state"],
  root: ["modules", "platform", "shared-state"],
  modules: ["platform", "shared-state", "domain"],
  platform: ["domain"],
  "shared-state": ["domain"],
  domain: [],
  server: ["domain"],
};

function layerImports(...layerNames) {
  return layerNames.flatMap((layerName) => [`@/${layerName}`, `@/${layerName}/**`]);
}

function forbiddenLayerImports(sourceLayer, additionallyAllowed = []) {
  const allowed = new Set([
    sourceLayer,
    ...allowedLayerImports[sourceLayer],
    ...additionallyAllowed,
  ]);
  return layerImports(...layerNames.filter((layerName) => !allowed.has(layerName)));
}

const moduleBoundaryRules = moduleNames.flatMap((moduleName) => {
  const otherModules = moduleNames.filter((candidate) => candidate !== moduleName);
  const commonPatterns = [
    {
      group: forbiddenLayerImports("modules"),
      message: "Modules may depend only on Platform, Shared State, Domain, and their own module.",
    },
    ...otherModules.map((candidate) => ({
      group: layerImports(`modules/${candidate}`),
      message: "Modules must remain independent from one another.",
    })),
  ];

  return [
    {
      files: [`src/modules/${moduleName}/**/*.{ts,tsx}`],
      ignores: [`src/modules/${moduleName}/**/*-controller.ts`],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            paths: [
              {
                name: "react",
                importNames: ["useSyncExternalStore"],
                message: "UI modules must use domain hooks from Shared State.",
              },
            ],
            patterns: commonPatterns.concat({
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
          },
        ],
      },
    },
    {
      files: [`src/modules/${moduleName}/**/*-controller.ts`],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            paths: [
              {
                name: "react",
                importNames: ["useSyncExternalStore"],
                message: "Controllers are framework-independent and never subscribe through React.",
              },
            ],
            patterns: commonPatterns,
          },
        ],
      },
    },
  ];
});

module.exports = defineConfig([
  globalIgnores(["dist/**", ".expo/**", "coverage/**", "node_modules/**", "supabase/.temp/**"]),
  expoConfig,
  {
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      "@stylistic/max-len": [
        "error",
        {
          code: 100,
          comments: 100,
          tabWidth: 2,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
        },
      ],
      "@stylistic/padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "*", next: "if" },
        { blankLine: "always", prev: "if", next: "*" },
      ],
      curly: ["error", "all"],
      "@stylistic/max-statements-per-line": ["error", { max: 1 }],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "ImportDeclaration[source.value=/^\\.\\./]",
          message:
            "Parent-relative imports are forbidden; use a @/ alias for architectural imports.",
        },
        {
          selector: "ExportNamedDeclaration[source.value=/^\\.\\./]",
          message:
            "Parent-relative exports are forbidden; use a @/ alias for architectural imports.",
        },
        {
          selector: "ExportAllDeclaration[source.value=/^\\.\\./]",
          message:
            "Parent-relative exports are forbidden; use a @/ alias for architectural imports.",
        },
        {
          selector: "ImportExpression[source.value=/^\\.\\./]",
          message: "Parent-relative dynamic imports are forbidden; use a @/ alias.",
        },
      ],
    },
  },
  {
    files: ["src/app/**/*.{ts,tsx}"],
    ignores: ["src/app/api/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: forbiddenLayerImports("app"),
              message: "App routes may depend only on Root, Modules, Platform, and Shared State.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/api/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: forbiddenLayerImports("app", ["server"]),
              message:
                "App API routes may additionally depend on Server, but not directly on Domain.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/root/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: forbiddenLayerImports("root"),
              message: "Root may depend only on Modules, Platform, and Shared State.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/platform/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: forbiddenLayerImports("platform"),
              message: "Platform may depend only on Domain and external packages.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/shared-state/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: forbiddenLayerImports("shared-state"),
              message: "Shared State may depend only on Domain and external state-free packages.",
            },
            {
              group: ["@supabase/**", "*powersync*", "*sqlite*", "*watermelondb*"],
              message: "Shared State cannot access network or database clients.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: forbiddenLayerImports("domain"),
              message: "Domain cannot depend on other application layers.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/server/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: forbiddenLayerImports("server"),
              message: "Server may depend only on Domain and external server packages.",
            },
          ],
        },
      ],
    },
  },
  ...moduleBoundaryRules,
]);
