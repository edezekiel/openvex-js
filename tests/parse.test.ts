import { describe, expect, it } from "vitest";
import { parseOpenVexDocument } from "../src/index.js";
import { loadFixture } from "./helpers/fixtures.js";
import { normalizeDocument, runVexCtlCreate } from "./helpers/vexctl.js";

/**
 * Helper to test that parsing produces identical normalized output
 * Ensures parse round-trip maintains all document structure
 */
function expectParseMatchesOriginal(fixturePath: string): void {
  const fixture = loadFixture(fixturePath);
  if (!fixture.vexctl) {
    throw new Error(`Fixture ${fixturePath} does not have vexctl options`);
  }
  const originalDoc = runVexCtlCreate(fixture.vexctl);
  const normalizedOriginal = normalizeDocument(originalDoc);

  // Parse the document
  const parsedDoc = parseOpenVexDocument(JSON.stringify(originalDoc));
  const normalizedParsed = normalizeDocument(parsedDoc);

  // Full equality check of normalized output
  expect(normalizedParsed).toEqual(normalizedOriginal);
}

describe("parseOpenVexDocument", () => {
  const fixtureTests = [
    { fixture: "create/basic-fixed.json", description: "basic fixed status document" },
    { fixture: "create/multiple-products.json", description: "document with multiple products" },
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
    { fixture: "create/with-subcomponents.json", description: "document with subcomponents" },
    { fixture: "create/with-status-notes.json", description: "document with status_notes" },
  ] as const;

  it.each(fixtureTests)("should parse $description", ({ fixture }) => {
    expectParseMatchesOriginal(fixture);
  });

  it("should throw error for invalid JSON", () => {
    expect(() => parseOpenVexDocument("invalid json")).toThrow();
  });

  it("should throw error for missing required fields", () => {
    expect(() => parseOpenVexDocument('{"@context": "https://openvex.dev/ns/v0.2.0"}')).toThrow();
  });
});
