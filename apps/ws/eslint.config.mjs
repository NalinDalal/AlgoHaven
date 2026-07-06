import { defineConfig } from "eslint/config";
import globals from "globals";
import { config as baseConfig } from "@repo/eslint-config/base";

export default defineConfig([
  ...baseConfig,
  {
    files: ["**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
]);