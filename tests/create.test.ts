import { describe, expect, it } from "vitest";
import { Component, OpenVexDocument, Statement } from "../src/index.js";
import { loadFixture } from "./helpers/fixtures.js";
import { normalizeDocument, runVexCtlCreate, vexctlOptionsToCreateDocumentOptions } from "./helpers/vexctl.js";

/**
 * Helper to test that library output matches vexctl output exactly
 * Compares normalized documents to ensure identical structure
 */
function expectMatchesVexCtl(fixturePath: string): void {
  const fixture = loadFixture(fixturePath);

  if (!fixture.vexctl) {
    throw new Error(`Fixture ${fixturePath} does not have vexctl options`);
  }

  // Run vexctl to get reference output
  const vexctlOutput = runVexCtlCreate(fixture.vexctl);
  const normalizedVexCtl = normalizeDocument(vexctlOutput);

  // Convert vexctl options to our library's format and create document
  const libraryOptions = vexctlOptionsToCreateDocumentOptions(fixture.vexctl);
  const libraryDoc = OpenVexDocument.create(libraryOptions);
  const normalizedLibrary = normalizeDocument(libraryDoc.toData());

  // Full equality check of normalized output
  expect(normalizedLibrary).toEqual(normalizedVexCtl);
}

/**
 * Helper to test library-only features (not supported by vexctl)
 * Verifies that the document structure is correct and parses as valid OpenVEX
 */
function expectValidLibraryDocument(fixturePath: string): void {
  const fixture = loadFixture(fixturePath);

  if (!fixture.library) {
    throw new Error(`Fixture ${fixturePath} does not have library options`);
  }

  // Create document using library options
  const doc = OpenVexDocument.create(fixture.library);

  // Verify it parses as valid OpenVEX
  const parsed = OpenVexDocument.parse(doc.toData());
  expect(parsed.toData()).toEqual(doc.toData());
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
    {
      fixture: "create/cpe-product-with-purl-subcomponent.json",
      description: "CPE product with purl subcomponent",
    },
  ] as const;

  it.each(fixtureTests)("should create $description matching vexctl", ({ fixture }) => {
    expectMatchesVexCtl(fixture);
  });

  it("should throw error for invalid identifier types", () => {
    // Invalid identifier that doesn't match purl, cpe22, or cpe23
    expect(() => Component.create("invalid-identifier")).toThrow(/Invalid identifier.*invalid-identifier/);

    // Valid identifiers should work
    expect(() => Component.create("pkg:apk/wolfi/git@2.39.0-r1")).not.toThrow();
    expect(() => Component.create("cpe:2.2:o:redhat:enterprise_linux:8")).not.toThrow();
    expect(() => Component.create("cpe:2.3:o:redhat:enterprise_linux:8:*:*:*:*:*:*:*")).not.toThrow();
  });

  it("should throw error when not_affected status has neither justification nor impactStatement", () => {
    expect(() =>
      OpenVexDocument.create({
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
      OpenVexDocument.create({
        author: "Test Author",
        statements: [],
      }),
    ).toThrow("at least one statement is required");
  });

  it("should throw error when no products provided in statement", () => {
    expect(() =>
      Statement.create({
        vulnerability: "CVE-2023-12345",
        status: "fixed",
        products: [],
      }),
    ).toThrow("at least one product is required");
  });
});

describe("Statement.create", () => {
  it("should create a statement with multiple products and per-product subcomponents", () => {
    const stmt = Statement.create({
      vulnerability: "CVE-2023-12345",
      status: "fixed",
      products: [
        { id: "pkg:apk/wolfi/git@2.39.0-r1", subcomponents: ["pkg:apk/wolfi/libcurl@7.87.0-r0"] },
        { id: "pkg:apk/wolfi/curl@7.87.0-r0", subcomponents: ["pkg:apk/wolfi/openssl@3.0.7-r0"] },
      ],
    });

    const products = stmt.toData().products ?? [];
    expect(products).toHaveLength(2);
    expect(products[0]?.subcomponents).toHaveLength(1);
    expect(products[1]?.subcomponents).toHaveLength(1);
  });

  it("should create a statement with mixed product formats", () => {
    const stmt = Statement.create({
      vulnerability: "CVE-2023-12345",
      status: "fixed",
      products: [
        "pkg:apk/wolfi/git@2.39.0-r1", // simple string
        { id: "pkg:apk/wolfi/curl@7.87.0-r0", subcomponents: ["pkg:apk/wolfi/openssl@3.0.7-r0"] }, // with subcomponents
      ],
    });

    const products = stmt.toData().products ?? [];
    expect(products).toHaveLength(2);
    expect(products[0]?.subcomponents).toBeUndefined();
    expect(products[1]?.subcomponents).toHaveLength(1);
  });
});

describe("OpenVexDocument.create with multiple statements", () => {
  it("should create a document with multiple statements", () => {
    const doc = OpenVexDocument.create({
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

    const data = doc.toData();
    expect(data.statements).toHaveLength(2);
    expect(data.statements[0]?.vulnerability.name).toBe("CVE-2023-1111");
    expect(data.statements[0]?.status).toBe("fixed");
    expect(data.statements[1]?.vulnerability.name).toBe("CVE-2023-2222");
    expect(data.statements[1]?.status).toBe("not_affected");
  });

  it("should create document from CreateStatementOptions", () => {
    const doc = OpenVexDocument.create({
      author: "Security Team",
      statements: [
        {
          vulnerability: "CVE-2023-1111",
          status: "fixed",
          products: ["pkg:apk/wolfi/git@2.39.0-r1"],
        },
      ],
    });

    const data = doc.toData();
    expect(data.statements).toHaveLength(1);
    expect(data.statements[0]?.vulnerability.name).toBe("CVE-2023-1111");
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
      const doc = OpenVexDocument.create({
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

      const data = doc.toData();
      expect(data["@context"]).toBe("https://openvex.dev/ns/v0.2.0");
      expect(data.author).toBe("Security Team");
      expect(data.statements).toHaveLength(1);

      const products = data.statements[0]?.products ?? [];
      expect(products).toHaveLength(2);
      expect(products[0]?.["@id"]).toBe("pkg:apk/wolfi/git@2.39.0-r1");
      expect(products[0]?.subcomponents).toHaveLength(1);
      expect(products[0]?.subcomponents?.[0]?.["@id"]).toBe("pkg:apk/wolfi/libcurl@7.87.0-r0");
      expect(products[1]?.["@id"]).toBe("pkg:apk/wolfi/curl@7.87.0-r0");
      expect(products[1]?.subcomponents).toHaveLength(1);
      expect(products[1]?.subcomponents?.[0]?.["@id"]).toBe("pkg:apk/wolfi/openssl@3.0.7-r0");

      const parsed = OpenVexDocument.parse(data);
      expect(parsed.toData()).toEqual(data);
    });

    it("should create valid OpenVEX with mixed product formats (string and object)", () => {
      const doc = OpenVexDocument.create({
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

      const data = doc.toData();
      const products = data.statements[0]?.products ?? [];
      expect(products).toHaveLength(3);
      expect(products[0]?.["@id"]).toBe("pkg:apk/wolfi/git@2.39.0-r1");
      expect(products[0]?.subcomponents).toBeUndefined();
      expect(products[1]?.["@id"]).toBe("pkg:apk/wolfi/curl@7.87.0-r0");
      expect(products[1]?.subcomponents).toHaveLength(1);
      expect(products[2]?.["@id"]).toBe("pkg:apk/wolfi/openssl@3.0.7-r0");
      expect(products[2]?.subcomponents).toBeUndefined();

      // Verify it parses as valid OpenVEX
      const parsed = OpenVexDocument.parse(doc.toData());
      expect(parsed.toData()).toEqual(doc.toData());
    });
  });

  describe("multiple statements", () => {
    it("should create valid OpenVEX with multiple statements for different vulnerabilities", () => {
      const doc = OpenVexDocument.create({
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

      const data = doc.toData();
      expect(data["@context"]).toBe("https://openvex.dev/ns/v0.2.0");
      expect(data.author).toBe("Security Team");
      expect(data.role).toBe("Vulnerability Analyst");
      expect(data.statements).toHaveLength(3);
      expect(data.statements[0]?.vulnerability.name).toBe("CVE-2023-1111");
      expect(data.statements[0]?.status).toBe("fixed");
      expect(data.statements[1]?.vulnerability.name).toBe("CVE-2023-2222");
      expect(data.statements[1]?.status).toBe("not_affected");
      expect(data.statements[2]?.vulnerability.name).toBe("CVE-2023-3333");
      expect(data.statements[2]?.status).toBe("under_investigation");

      const parsed = OpenVexDocument.parse(data);
      expect(parsed.toData()).toEqual(data);
    });

    it("should create valid OpenVEX with multiple statements having different statuses and options", () => {
      const doc = OpenVexDocument.create({
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

      const data = doc.toData();
      expect(data.statements).toHaveLength(3);

      const fixedStmt = data.statements[0];
      expect(fixedStmt?.status).toBe("fixed");
      expect(fixedStmt?.status_notes).toBe("Patched in version 2.39.0-r1");

      const affectedStmt = data.statements[1];
      expect(affectedStmt?.status).toBe("affected");
      if (!affectedStmt) return;
      expect("action_statement" in affectedStmt && affectedStmt.action_statement).toBe(
        "Upgrade to curl 7.87.0-r0 or later",
      );

      const notAffectedStmt = data.statements[2];
      expect(notAffectedStmt?.status).toBe("not_affected");
      if (!notAffectedStmt) return;
      expect("justification" in notAffectedStmt && notAffectedStmt.justification).toBe("vulnerable_code_not_present");
      expect("impact_statement" in notAffectedStmt && notAffectedStmt.impact_statement).toBe(
        "The vulnerable code path is not compiled in this build",
      );
      expect(notAffectedStmt.products?.[0]?.subcomponents).toHaveLength(1);

      const parsed = OpenVexDocument.parse(data);
      expect(parsed.toData()).toEqual(data);
    });
  });

  describe("hash support", () => {
    const hashFixtureTests = [
      { fixture: "create/with-hashes.json", description: "document with product hashes" },
      {
        fixture: "create/with-hashes-comprehensive.json",
        description: "comprehensive document with multiple products, subcomponents, and hashes",
      },
    ] as const;

    it.each(hashFixtureTests)("should create valid OpenVEX $description", ({ fixture }) => {
      expectValidLibraryDocument(fixture);
    });

    it("should create document with product hashes", () => {
      const doc = OpenVexDocument.create({
        author: "Test Author",
        statements: [
          {
            vulnerability: "CVE-2022-39260",
            status: "fixed",
            products: [
              {
                id: "pkg:apk/wolfi/product@1.23.0-r1?arch=armv7",
                hashes: {
                  "sha-256": "402fa523b96591d4450ace90e32d9f779fcfd938903e1c5bf9d3701860b8f856",
                  "sha-512":
                    "d2eb65b083923d90cf55111c598f81d3d9c66f4457dfd173f01a6b7306f3b222541be42a35fe47191a9ca00e017533e8c07ca192bd22954e125557c72d2a3178",
                },
              },
            ],
          },
        ],
      });

      const data = doc.toData();
      const product = data.statements[0]?.products?.[0];
      expect(product?.hashes?.["sha-256"]).toBe("402fa523b96591d4450ace90e32d9f779fcfd938903e1c5bf9d3701860b8f856");
      expect(product?.hashes?.["sha-512"]).toBe(
        "d2eb65b083923d90cf55111c598f81d3d9c66f4457dfd173f01a6b7306f3b222541be42a35fe47191a9ca00e017533e8c07ca192bd22954e125557c72d2a3178",
      );

      const parsed = OpenVexDocument.parse(data);
      expect(parsed.toData()).toEqual(data);
    });

    it("should create document with product hashes and subcomponents that also have hashes", () => {
      const doc = OpenVexDocument.create({
        author: "Test Author",
        statements: [
          {
            vulnerability: "CVE-2023-12345",
            status: "not_affected",
            justification: "component_not_present",
            products: [
              {
                id: "pkg:apk/wolfi/product@1.23.0-r1?arch=armv7",
                hashes: {
                  "sha-256": "402fa523b96591d4450ace90e32d9f779fcfd938903e1c5bf9d3701860b8f856",
                },
                subcomponents: [
                  {
                    id: "pkg:apk/wolfi/libcurl@7.87.0-r0",
                    hashes: {
                      "sha-256": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2",
                    },
                  },
                  "pkg:apk/wolfi/openssl@3.0.7-r0",
                ],
              },
            ],
          },
        ],
      });

      const data = doc.toData();
      const product = data.statements[0]?.products?.[0];
      expect(product?.hashes?.["sha-256"]).toBe("402fa523b96591d4450ace90e32d9f779fcfd938903e1c5bf9d3701860b8f856");
      expect(product?.subcomponents).toHaveLength(2);
      expect(product?.subcomponents?.[0]?.hashes?.["sha-256"]).toBe(
        "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2",
      );
      expect(product?.subcomponents?.[1]?.hashes).toBeUndefined();

      const parsed = OpenVexDocument.parse(data);
      expect(parsed.toData()).toEqual(data);
    });
  });
});
