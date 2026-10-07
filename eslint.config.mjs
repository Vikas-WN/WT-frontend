import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: [
      "src/app/(protected)/dashboard/**/page.tsx",
      "src/components/dashboard/**/*PageClient.tsx",
    ],
    rules: {
      // Dashboard is a large legacy surface; many effects reset derived UI state from URL/tabs.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    rules: {
      // The app loads data in effects and sets a loading flag first ("load on mount"). The React Compiler lint flags
      // every such effect (~80 across the app). They are not runtime bugs, and rewriting each into a query or an event
      // handler is its own behaviour-changing refactor, so it stays visible as a warning instead of failing lint.
      // New code should not add more: prefer TanStack Query for loading and derive state instead of copying it.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
