import { describe, expect, it } from "vitest";
import { createDocument, createProduct } from "../src/index.js";
import { loadFixture } from "./helpers/fixtures.js";
import { normalizeDocument, runVexCtlCreate } from "./helpers/vexctl.js";

/**
 * Helper to test that library output matches vexctl output exactly
 * Compares normalized documents to ensure identical structure
 */
function expectMatchesVexCtl(fixturePath: string): void {
  const fixture = loadFixture(fixturePath);

  // Run vexctl to get reference output
  const vexctlOutput = runVexCtlCreate(fixture.vexctl);
  const normalizedVexCtl = normalizeDocument(vexctlOutput);

  // Create document using our library
  const libraryOutput = createDocument(fixture.vexctl);
  const normalizedLibrary = normalizeDocument(libraryOutput);

  // Full equality check of normalized output
  expect(normalizedLibrary).toEqual(normalizedVexCtl);
}

describe("createDocument", () => {
  const fixtureTests = [
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
    { fixture: "create/multiple-products.json", description: "document with multiple products" },
  ] as const;

  it.each(fixtureTests)("should create $description matching vexctl", ({ fixture }) => {
    expectMatchesVexCtl(fixture);
  });

  it("should throw error for invalid identifier types", () => {
    // Invalid identifier that doesn't match purl, cpe22, or cpe23
    expect(() => createProduct("invalid-identifier")).toThrow(
      'Invalid identifier type: "invalid-identifier". Only purl (pkg:...), cpe22 (cpe:2.2:...), and cpe23 (cpe:2.3:...) are allowed.',
    );

    // Valid identifiers should work
    expect(() => createProduct("pkg:apk/wolfi/git@2.39.0-r1")).not.toThrow();
    expect(() => createProduct("cpe:2.2:o:redhat:enterprise_linux:8")).not.toThrow();
    expect(() => createProduct("cpe:2.3:o:redhat:enterprise_linux:8:*:*:*:*:*:*:*")).not.toThrow();
  });

  it("should throw error when not_affected status has neither justification nor impactStatement", () => {
    expect(() =>
      createDocument({
        product: "pkg:apk/wolfi/git@2.39.0-r1",
        vulnerability: "CVE-2023-12345",
        status: "not_affected",
        author: "Test Author",
      }),
    ).toThrow("not_affected status requires either justification or impactStatement");
  });
});
