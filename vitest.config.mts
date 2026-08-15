import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: "@", replacement: path.join(rootDirectory, "src") },
      {
        find: /^react-native$/,
        replacement: path.join(rootDirectory, "tests", "support", "react-native.tsx"),
      },
      {
        find: /^phosphor-react-native$/,
        replacement: path.join(rootDirectory, "tests", "support", "phosphor-react-native.tsx"),
      },
      {
        find: /^@expo-google-fonts\/(?:inter|manrope)\/.+$/,
        replacement: path.join(rootDirectory, "tests", "support", "font-asset.ts"),
      },
    ],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
    coverage: { provider: "v8", reporter: ["text", "html"] },
  },
});
