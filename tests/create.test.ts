import { describe, expect, it } from "vitest";
import { createDocument, createProduct, createStatement, parseOpenVexDocument } from "../src/index.js";
import { loadFixture } from "./helpers/fixtures.js";
import { normalizeDocument, runVexCtlCreate, vexctlOptionsToCreateDocumentOptions } from "./helpers/vexctl.js";

/**
 * Helper to test that library output matches vexctl output exactly
 * Compares normalized documents to ensure identical structure
 */
function expectMatchesVexCtl(fixturePath: string): void {
  const fixture = loadFixture(fixturePath);

  // Run vexctl to get reference output
  const vexctlOutput = runVexCtlCreate(fixture.vexctl);
  const normalizedVexCtl = normalizeDocument(vexctlOutput);

  // Convert vexctl options to our library's format and create document
  const libraryOptions = vexctlOptionsToCreateDocumentOptions(fixture.vexctl);
  const libraryOutput = createDocument(libraryOptions);
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
    { fixture: "create/under-investigation.json", description: "under_investigation status document" },
    { fixture: "create/multiple-products.json", description: "document with multiple products" },
    { fixture: "create/with-subcomponents.json", description: "document with subcomponents" },
    { fixture: "create/with-status-notes.json", description: "document with status_notes" },
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
        author: "Test Author",
        statements: [
          {
            vulnerability: "CVE-2023-12345",
            status: "not_affected",
            products: ["pkg:apk/wolfi/git@2.39.0-r1"],
          },
        ],
      }),
    ).toThrow("not_affected status requires either justification or impactStatement");
  });

  it("should throw error when no statements provided", () => {
    expect(() =>
      createDocument({
        author: "Test Author",
        statements: [],
      }),
    ).toThrow("at least one statement is required");
  });

  it("should throw error when no products provided in statement", () => {
    expect(() =>
      createStatement({
        vulnerability: "CVE-2023-12345",
        status: "fixed",
        products: [],
      }),
    ).toThrow("at least one product is required");
  });
});

describe("createStatement", () => {
  it("should create a statement with multiple products and per-product subcomponents", () => {
    const stmt = createStatement({
      vulnerability: "CVE-2023-12345",
      status: "fixed",
      products: [
        { id: "pkg:apk/wolfi/git@2.39.0-r1", subcomponents: ["pkg:apk/wolfi/libcurl@7.87.0-r0"] },
        { id: "pkg:apk/wolfi/curl@7.87.0-r0", subcomponents: ["pkg:apk/wolfi/openssl@3.0.7-r0"] },
      ],
    });

    const products = stmt.products ?? [];
    expect(products).toHaveLength(2);
    expect(products[0]?.subcomponents).toHaveLength(1);
    expect(products[1]?.subcomponents).toHaveLength(1);
  });

  it("should create a statement with mixed product formats", () => {
    const stmt = createStatement({
      vulnerability: "CVE-2023-12345",
      status: "fixed",
      products: [
        "pkg:apk/wolfi/git@2.39.0-r1", // simple string
        { id: "pkg:apk/wolfi/curl@7.87.0-r0", subcomponents: ["pkg:apk/wolfi/openssl@3.0.7-r0"] }, // with subcomponents
      ],
    });

    const products = stmt.products ?? [];
    expect(products).toHaveLength(2);
    expect(products[0]?.subcomponents).toBeUndefined();
    expect(products[1]?.subcomponents).toHaveLength(1);
  });
});

describe("createDocument with multiple statements", () => {
  it("should create a document with multiple statements", () => {
    const doc = createDocument({
      author: "Security Team",
      statements: [
        {
          vulnerability: "CVE-2023-1111",
          status: "fixed",
          products: ["pkg:apk/wolfi/git@2.39.0-r1"],
        },
        {
          vulnerability: "CVE-2023-2222",
          status: "not_affected",
          products: ["pkg:apk/wolfi/curl@7.87.0-r0"],
          justification: "component_not_present",
        },
      ],
    });

    expect(doc.statements).toHaveLength(2);
    const stmt0 = doc.statements[0];
    const stmt1 = doc.statements[1];
    expect(stmt0).toBeDefined();
    expect(stmt1).toBeDefined();
    if (!stmt0 || !stmt1) return;
    expect(stmt0.vulnerability.name).toBe("CVE-2023-1111");
    expect(stmt0.status).toBe("fixed");
    expect(stmt1.vulnerability.name).toBe("CVE-2023-2222");
    expect(stmt1.status).toBe("not_affected");
  });

  it("should accept pre-built Statement objects", () => {
    const stmt1 = createStatement({
      vulnerability: "CVE-2023-1111",
      status: "fixed",
      products: ["pkg:apk/wolfi/git@2.39.0-r1"],
    });

    const doc = createDocument({
      author: "Security Team",
      statements: [stmt1],
    });

    expect(doc.statements).toHaveLength(1);
    expect(doc.statements[0]).toBe(stmt1);
  });
});

/**
 * Tests for library-only features not supported by vexctl
 * These test that:
 * 1. The output has the correct structure
 * 2. The output parses as valid OpenVEX
 */
describe("library-only features (not in vexctl)", () => {
  describe("per-product subcomponents", () => {
    it("should create valid OpenVEX with multiple products each having subcomponents", () => {
      const doc = createDocument({
        author: "Security Team",
        statements: [
          {
            vulnerability: "CVE-2023-12345",
            status: "fixed",
            products: [
              { id: "pkg:apk/wolfi/git@2.39.0-r1", subcomponents: ["pkg:apk/wolfi/libcurl@7.87.0-r0"] },
              { id: "pkg:apk/wolfi/curl@7.87.0-r0", subcomponents: ["pkg:apk/wolfi/openssl@3.0.7-r0"] },
            ],
          },
        ],
      });

      // Verify structure
      expect(doc["@context"]).toBe("https://openvex.dev/ns/v0.2.0");
      expect(doc.author).toBe("Security Team");
      expect(doc.statements).toHaveLength(1);

      const stmt = doc.statements[0];
      expect(stmt).toBeDefined();
      if (!stmt) return;
      const products = stmt.products ?? [];
      expect(products).toHaveLength(2);

      // First product with subcomponent
      expect(products[0]?.["@id"]).toBe("pkg:apk/wolfi/git@2.39.0-r1");
      expect(products[0]?.subcomponents).toHaveLength(1);
      expect(products[0]?.subcomponents?.[0]?.["@id"]).toBe("pkg:apk/wolfi/libcurl@7.87.0-r0");

      // Second product with subcomponent
      expect(products[1]?.["@id"]).toBe("pkg:apk/wolfi/curl@7.87.0-r0");
      expect(products[1]?.subcomponents).toHaveLength(1);
      expect(products[1]?.subcomponents?.[0]?.["@id"]).toBe("pkg:apk/wolfi/openssl@3.0.7-r0");

      // Verify it parses as valid OpenVEX
      const parsed = parseOpenVexDocument(JSON.stringify(doc));
      expect(parsed).toEqual(doc);
    });

    it("should create valid OpenVEX with mixed product formats (string and object)", () => {
      const doc = createDocument({
        author: "Security Team",
        statements: [
          {
            vulnerability: "CVE-2023-12345",
            status: "fixed",
            products: [
              "pkg:apk/wolfi/git@2.39.0-r1", // simple string
              { id: "pkg:apk/wolfi/curl@7.87.0-r0", subcomponents: ["pkg:apk/wolfi/openssl@3.0.7-r0"] },
              "pkg:apk/wolfi/openssl@3.0.7-r0", // another simple string
            ],
          },
        ],
      });

      const stmt = doc.statements[0];
      expect(stmt).toBeDefined();
      if (!stmt) return;
      const products = stmt.products ?? [];
      expect(products).toHaveLength(3);

      // First product (simple string, no subcomponents)
      expect(products[0]?.["@id"]).toBe("pkg:apk/wolfi/git@2.39.0-r1");
      expect(products[0]?.subcomponents).toBeUndefined();

      // Second product (with subcomponents)
      expect(products[1]?.["@id"]).toBe("pkg:apk/wolfi/curl@7.87.0-r0");
      expect(products[1]?.subcomponents).toHaveLength(1);

      // Third product (simple string, no subcomponents)
      expect(products[2]?.["@id"]).toBe("pkg:apk/wolfi/openssl@3.0.7-r0");
      expect(products[2]?.subcomponents).toBeUndefined();

      // Verify it parses as valid OpenVEX
      const parsed = parseOpenVexDocument(JSON.stringify(doc));
      expect(parsed).toEqual(doc);
    });
  });

  describe("multiple statements", () => {
    it("should create valid OpenVEX with multiple statements for different vulnerabilities", () => {
      const doc = createDocument({
        author: "Security Team",
        role: "Vulnerability Analyst",
        statements: [
          {
            vulnerability: "CVE-2023-1111",
            status: "fixed",
            products: ["pkg:apk/wolfi/git@2.39.0-r1"],
          },
          {
            vulnerability: "CVE-2023-2222",
            status: "not_affected",
            products: ["pkg:apk/wolfi/curl@7.87.0-r0"],
            justification: "component_not_present",
          },
          {
            vulnerability: "CVE-2023-3333",
            status: "under_investigation",
            products: ["pkg:apk/wolfi/openssl@3.0.7-r0"],
          },
        ],
      });

      // Verify document structure
      expect(doc["@context"]).toBe("https://openvex.dev/ns/v0.2.0");
      expect(doc.author).toBe("Security Team");
      expect(doc.role).toBe("Vulnerability Analyst");
      expect(doc.statements).toHaveLength(3);

      // Verify each statement
      expect(doc.statements[0]?.vulnerability.name).toBe("CVE-2023-1111");
      expect(doc.statements[0]?.status).toBe("fixed");

      expect(doc.statements[1]?.vulnerability.name).toBe("CVE-2023-2222");
      expect(doc.statements[1]?.status).toBe("not_affected");

      expect(doc.statements[2]?.vulnerability.name).toBe("CVE-2023-3333");
      expect(doc.statements[2]?.status).toBe("under_investigation");

      // Verify it parses as valid OpenVEX
      const parsed = parseOpenVexDocument(JSON.stringify(doc));
      expect(parsed).toEqual(doc);
    });

    it("should create valid OpenVEX with multiple statements having different statuses and options", () => {
      const doc = createDocument({
        author: "Security Team",
        statements: [
          {
            vulnerability: "CVE-2023-1111",
            status: "fixed",
            products: ["pkg:apk/wolfi/git@2.39.0-r1"],
            statusNote: "Patched in version 2.39.0-r1",
          },
          {
            vulnerability: "CVE-2023-2222",
            status: "affected",
            products: ["pkg:apk/wolfi/curl@7.86.0-r0"],
            actionStatement: "Upgrade to curl 7.87.0-r0 or later",
          },
          {
            vulnerability: "CVE-2023-3333",
            status: "not_affected",
            products: [{ id: "pkg:apk/wolfi/openssl@3.0.7-r0", subcomponents: ["pkg:apk/wolfi/libssl@3.0.7-r0"] }],
            justification: "vulnerable_code_not_present",
            impactStatement: "The vulnerable code path is not compiled in this build",
          },
        ],
      });

      expect(doc.statements).toHaveLength(3);

      // Fixed statement with status note
      const fixedStmt = doc.statements[0];
      expect(fixedStmt).toBeDefined();
      if (!fixedStmt) return;
      expect(fixedStmt.status).toBe("fixed");
      expect(fixedStmt.status_notes).toBe("Patched in version 2.39.0-r1");

      // Affected statement with action statement
      const affectedStmt = doc.statements[1];
      expect(affectedStmt).toBeDefined();
      if (!affectedStmt) return;
      expect(affectedStmt.status).toBe("affected");
      expect("action_statement" in affectedStmt && affectedStmt.action_statement).toBe(
        "Upgrade to curl 7.87.0-r0 or later",
      );

      // Not affected statement with justification, impact statement, and subcomponents
      const notAffectedStmt = doc.statements[2];
      expect(notAffectedStmt).toBeDefined();
      if (!notAffectedStmt) return;
      expect(notAffectedStmt.status).toBe("not_affected");
      expect("justification" in notAffectedStmt && notAffectedStmt.justification).toBe("vulnerable_code_not_present");
      expect("impact_statement" in notAffectedStmt && notAffectedStmt.impact_statement).toBe(
        "The vulnerable code path is not compiled in this build",
      );
      expect(notAffectedStmt.products?.[0]?.subcomponents).toHaveLength(1);

      // Verify it parses as valid OpenVEX
      const parsed = parseOpenVexDocument(JSON.stringify(doc));
      expect(parsed).toEqual(doc);
    });
  });
});
