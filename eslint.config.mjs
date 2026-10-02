import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Module boundaries from docs/ARCHITECTURE.md §4. Each block below encodes
// one row of that table as import restrictions. Keep this file in sync with
// the table rather than the other way around.
const restrict = (files, group, message) => ({
  files,
  rules: {
    "no-restricted-imports": ["error", { patterns: [{ group, message }] }],
  },
});

const boundaryRules = [
  restrict(
    ["src/schemas/**"],
    [
      "@/engine",
      "@/engine/*",
      "@/reference",
      "@/reference/*",
      "@/providers",
      "@/providers/*",
      "@/ai",
      "@/ai/*",
      "@/lib",
      "@/lib/*",
      "@/features",
      "@/features/*",
      "@/components",
      "@/components/*",
      "@/app",
      "@/app/*",
    ],
    "schemas is the dependency root: it may not import from any other module (docs/ARCHITECTURE.md §4).",
  ),
  restrict(
    ["src/engine/**"],
    [
      "@/components",
      "@/components/*",
      "@/app",
      "@/app/*",
      "@/lib",
      "@/lib/*",
      "@/ai",
      "@/ai/*",
    ],
    "engine must stay pure: no UI, DB/network, or AI imports (docs/ARCHITECTURE.md §4). Reference data is passed in as a parameter, not imported.",
  ),
  restrict(
    ["src/reference/**"],
    ["@/components", "@/components/*", "@/app", "@/app/*", "@/ai", "@/ai/*"],
    "reference must not import UI or AI code (docs/ARCHITECTURE.md §4).",
  ),
  restrict(
    ["src/providers/**"],
    [
      "@/components",
      "@/components/*",
      "@/app",
      "@/app/*",
      "@/engine",
      "@/engine/*",
      "@/lib",
      "@/lib/*",
      "@/ai",
      "@/ai/*",
      "@/features",
      "@/features/*",
    ],
    "providers may import only schemas (docs/ARCHITECTURE.md §4).",
  ),
  restrict(
    ["src/ai/**"],
    ["@/lib", "@/lib/*", "@/components", "@/components/*", "@/app", "@/app/*"],
    "ai must not import the DB client (lib) or UI code directly (docs/ARCHITECTURE.md §4).",
  ),
  restrict(
    ["src/lib/**"],
    [
      "@/engine",
      "@/engine/*",
      "@/ai",
      "@/ai/*",
      "@/components",
      "@/components/*",
      "@/app",
      "@/app/*",
      "@/features",
      "@/features/*",
    ],
    "lib may import only schemas (docs/ARCHITECTURE.md §4).",
  ),
  restrict(
    ["src/components/**"],
    ["@/lib", "@/lib/*"],
    "components must not import lib (DB/Supabase access) directly (docs/ARCHITECTURE.md §4).",
  ),
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...boundaryRules,
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
