/**
 * Shared test fixture helpers
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { VexCtlCreateOptions } from "./vexctl.js";

/**
 * Helper to load test fixtures
 */
export function loadFixture(path: string): { description: string; vexctl: VexCtlCreateOptions } {
  const fullPath = join(import.meta.dirname, "..", "fixtures", path);
  const content = readFileSync(fullPath, "utf-8");
  return JSON.parse(content) as { description: string; vexctl: VexCtlCreateOptions };
}
