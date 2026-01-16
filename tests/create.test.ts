import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
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
    const _normalizedVexCtl = normalizeDocument(vexctlOutput);

    // TODO: Implement createDocument function
    // const libraryOutput = createDocument(fixture.vexctl);
    // const normalizedLibrary = normalizeDocument(libraryOutput);
    // expect(normalizedLibrary).toEqual(normalizedVexCtl);

    // For now, just verify vexctl runs successfully and produces expected structure
    expect(vexctlOutput).toBeDefined();
    expect((vexctlOutput as { "@context"?: string })["@context"]).toBe("https://openvex.dev/ns/v0.2.0");
  });

  it("should create not_affected document with justification matching vexctl", () => {
    const fixture = loadFixture("create/not-affected-justification.json");
    const vexctlOutput = runVexCtlCreate(fixture.vexctl);
    const _normalizedVexCtl = normalizeDocument(vexctlOutput);

    // TODO: Implement createDocument function
    // const libraryOutput = createDocument(fixture.vexctl);
    // const normalizedLibrary = normalizeDocument(libraryOutput);
    // expect(normalizedLibrary).toEqual(normalizedVexCtl);

    expect(vexctlOutput).toBeDefined();
    expect((vexctlOutput as { statements?: unknown[] })?.statements?.[0]).toHaveProperty(
      "justification",
      "component_not_present",
    );
  });

  it("should create affected document with action statement matching vexctl", () => {
    const fixture = loadFixture("create/affected-action-statement.json");
    const vexctlOutput = runVexCtlCreate(fixture.vexctl);
    const _normalizedVexCtl = normalizeDocument(vexctlOutput);

    // TODO: Implement createDocument function
    // const libraryOutput = createDocument(fixture.vexctl);
    // const normalizedLibrary = normalizeDocument(libraryOutput);
    // expect(normalizedLibrary).toEqual(normalizedVexCtl);

    expect(vexctlOutput).toBeDefined();
    const statement = (vexctlOutput as { statements?: unknown[] })?.statements?.[0] as {
      action_statement?: string;
    };
    expect(statement?.action_statement).toBeDefined();
    expect(statement?.action_statement).toContain("Customers");
  });

  it("should create document with multiple products matching vexctl", () => {
    const fixture = loadFixture("create/multiple-products.json");
    const vexctlOutput = runVexCtlCreate(fixture.vexctl);
    const _normalizedVexCtl = normalizeDocument(vexctlOutput);

    // TODO: Implement createDocument function
    // const libraryOutput = createDocument(fixture.vexctl);
    // const normalizedLibrary = normalizeDocument(libraryOutput);
    // expect(normalizedLibrary).toEqual(normalizedVexCtl);

    expect(vexctlOutput).toBeDefined();
    const products = (vexctlOutput as { statements?: Array<{ products?: unknown[] }> })?.statements?.[0]?.products;
    expect(products).toHaveLength(2);
  });
});
