import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";

import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt(eslintConfigPrettier, {
  languageOptions: {
    ecmaVersion: 2025,
    sourceType: "module",
    globals: {
      ...globals.browser,
      ...globals.node,
    },
  },
  rules: {
    "no-console": ["error", { allow: ["trace", "debug", "info", "warn", "error"] }],
  },
  ignores: ["node_modules/**", ".nitro/**", ".nuxt/**", ".output/**", "dist/**"],
});
