import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createDocument, createProduct } from "../src/index.js";
import { normalizeDocument, runVexCtlCreate, type VexCtlCreateOptions } from "./helpers/vexctl.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Helper to load test fixtures
 */
function loadFixture(path: string): { description: string; vexctl: VexCtlCreateOptions } {
  const fullPath = join(__dirname, "fixtures", path);
  const content = readFileSync(fullPath, "utf-8");
  return JSON.parse(content) as { description: string; vexctl: VexCtlCreateOptions };
}

describe("createDocument", () => {
  it("should create a basic fixed status document matching vexctl", () => {
    const fixture = loadFixture("create/basic-fixed.json");

    // Run vexctl to get reference output
    const vexctlOutput = runVexCtlCreate(fixture.vexctl);
    const normalizedVexCtl = normalizeDocument(vexctlOutput);

    // Create document using our library
    const libraryOutput = createDocument(fixture.vexctl);
    const normalizedLibrary = normalizeDocument(libraryOutput);
    expect(normalizedLibrary).toEqual(normalizedVexCtl);
  });

  it("should create not_affected document with justification matching vexctl", () => {
    const fixture = loadFixture("create/not-affected-justification.json");
    const vexctlOutput = runVexCtlCreate(fixture.vexctl);
    const normalizedVexCtl = normalizeDocument(vexctlOutput);

    // Create document using our library
    const libraryOutput = createDocument(fixture.vexctl);
    const normalizedLibrary = normalizeDocument(libraryOutput);
    expect(normalizedLibrary).toEqual(normalizedVexCtl);
  });

  it("should create affected document with action statement matching vexctl", () => {
    const fixture = loadFixture("create/affected-action-statement.json");
    const vexctlOutput = runVexCtlCreate(fixture.vexctl);
    const normalizedVexCtl = normalizeDocument(vexctlOutput);

    // Create document using our library
    const libraryOutput = createDocument(fixture.vexctl);
    const normalizedLibrary = normalizeDocument(libraryOutput);
    expect(normalizedLibrary).toEqual(normalizedVexCtl);
  });

  it("should create document with multiple products matching vexctl", () => {
    const fixture = loadFixture("create/multiple-products.json");
    const vexctlOutput = runVexCtlCreate(fixture.vexctl);
    const normalizedVexCtl = normalizeDocument(vexctlOutput);

    // Create document using our library
    const libraryOutput = createDocument(fixture.vexctl);
    const normalizedLibrary = normalizeDocument(libraryOutput);
    expect(normalizedLibrary).toEqual(normalizedVexCtl);
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

  it("should require at least one of justification or impactStatement for not_affected", () => {
    // Should throw if neither is provided
    expect(() =>
      createDocument({
        product: "pkg:apk/wolfi/git@2.39.0-r1",
        vulnerability: "CVE-2023-12345",
        status: "not_affected",
        author: "Test Author",
      }),
    ).toThrow("not_affected status requires either justification or impactStatement");

    // Should work with just justification
    expect(() =>
      createDocument({
        product: "pkg:apk/wolfi/git@2.39.0-r1",
        vulnerability: "CVE-2023-12345",
        status: "not_affected",
        justification: "component_not_present",
        author: "Test Author",
      }),
    ).not.toThrow();

    // Should work with just impactStatement
    expect(() =>
      createDocument({
        product: "pkg:apk/wolfi/git@2.39.0-r1",
        vulnerability: "CVE-2023-12345",
        status: "not_affected",
        impactStatement: "The component is not present in this product",
        author: "Test Author",
      }),
    ).not.toThrow();

    // Should work with both
    expect(() =>
      createDocument({
        product: "pkg:apk/wolfi/git@2.39.0-r1",
        vulnerability: "CVE-2023-12345",
        status: "not_affected",
        justification: "component_not_present",
        impactStatement: "The component is not present in this product",
        author: "Test Author",
      }),
    ).not.toThrow();
  });
});
