import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Scratch / one-off utility files
    "scratch.tsx",
    "scratch2.ts",
    "scratch3.ts",
    "query.ts",
    "test-route.js",
    "test-update.ts",
    "generate-svgs.js",
  ]),
]);

export default eslintConfig;
