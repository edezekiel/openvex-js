import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { CreateDocumentOptions } from "../../src/classes/document.js";
import type { VexCtlOptions } from "./vexctl.js";

export function loadFixture(path: string): {
  description: string;
  vexctl?: VexCtlOptions;
  library?: CreateDocumentOptions;
  expectedError?: string;
} {
  const fullPath = join(import.meta.dirname, "..", "fixtures", path);
  const content = readFileSync(fullPath, "utf-8");
  return JSON.parse(content) as {
    description: string;
    vexctl?: VexCtlOptions;
    library?: CreateDocumentOptions;
    expectedError?: string;
  };
}

export const validVexctlFixtureTests = [
  { fixture: "create/basic-fixed.json", description: "basic fixed status document" },
  { fixture: "create/not-affected-justification.json", description: "not_affected document with justification" },
  {
    fixture: "create/not-affected-impact-statement.json",
    description: "not_affected document with impact statement only",
  },
  {
    fixture: "create/not-affected-both.json",
    description: "not_affected document with both justification and impact statement",
  },
  { fixture: "create/affected-action-statement.json", description: "affected document with action statement" },
  { fixture: "create/under-investigation.json", description: "under_investigation status document" },
  { fixture: "create/multiple-products.json", description: "document with multiple products" },
  { fixture: "create/with-subcomponents.json", description: "document with subcomponents" },
  { fixture: "create/with-status-notes.json", description: "document with status_notes" },
  {
    fixture: "create/cpe-product-with-purl-subcomponent.json",
    description: "CPE product with purl subcomponent",
  },
] as const;

export const errorVexctlFixtureTests = [
  {
    fixture: "create/error-not-affected-no-justification.json",
    description: "not_affected status has neither justification nor impactStatement",
  },
  { fixture: "create/error-not-affected-with-action.json", description: "not_affected status has actionStatement" },
  { fixture: "create/error-affected-with-justification.json", description: "affected status has justification" },
  { fixture: "create/error-affected-with-impact.json", description: "affected status has impactStatement" },
  { fixture: "create/error-fixed-with-justification.json", description: "fixed status has justification" },
  { fixture: "create/error-fixed-with-action.json", description: "fixed status has actionStatement" },
  {
    fixture: "create/error-under-investigation-with-impact.json",
    description: "under_investigation status has impactStatement",
  },
] as const;

export const vexctlFixtureTests = [...validVexctlFixtureTests, ...errorVexctlFixtureTests] as const;
