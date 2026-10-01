import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { findLanguagePolicyViolations } from "@/schemas/language-policy";

// PRD INT-6 / CLAUDE.md rules 4-5: UI copy may never contain ranking or
// advice phrasing. This scans every source file that can render user-facing
// text. It intentionally excludes src/schemas (where the banned-phrase list
// itself lives) and src/components/ui (generated shadcn primitives with no
// product copy).
const SCAN_ROOTS = ["src/app", "src/components", "src/features", "src/content"];
const EXCLUDED_DIRS = ["src/components/ui"];

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    const normalized = path.replace(/\\/g, "/");
    if (EXCLUDED_DIRS.some((excluded) => normalized.startsWith(excluded))) {
      continue;
    }
    if (entry.isDirectory()) {
      files.push(...walk(path));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(path);
    }
  }
  return files;
}

describe("UI copy language policy", () => {
  const files = SCAN_ROOTS.flatMap((root) => walk(root));

  it("finds at least one file to scan", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s contains no ranking or advice phrasing", (file) => {
    const text = readFileSync(file, "utf-8");
    const violations = findLanguagePolicyViolations(text);
    expect(violations).toEqual([]);
  });
});
