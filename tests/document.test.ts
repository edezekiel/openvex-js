import { describe, expect, it } from "vitest";
import { Document, OpenVexValidationError } from "../src/index.js";

function createBasicDoc(overrides?: { author?: string }) {
  return Document.create({
    author: overrides?.author ?? "Test Author",
    statements: [
      {
        vulnerability: "CVE-2024-0001",
        status: "fixed",
        products: ["pkg:npm/test-pkg@1.0.0"],
      },
    ],
  });
}

describe("Document.serialize", () => {
  it("should return a JSON string", () => {
    const doc = createBasicDoc();
    const json = doc.serialize();
    expect(typeof json).toBe("string");
    const parsed = JSON.parse(json);
    expect(parsed["@context"]).toBe("https://openvex.dev/ns/v0.2.0");
  });

  it("should produce the same data as toJSON", () => {
    const doc = createBasicDoc();
    expect(JSON.parse(doc.serialize())).toEqual(doc.toJSON());
  });
});

describe("Document.fromJSON", () => {
  it("should parse a valid JSON string", () => {
    const doc = createBasicDoc();
    const json = doc.serialize();
    const parsed = Document.fromJSON(json);
    expect(parsed.toJSON()).toEqual(doc.toJSON());
  });

  it("should throw OpenVexValidationError for invalid JSON", () => {
    expect(() => Document.fromJSON("not json")).toThrow(OpenVexValidationError);
  });

  it("should throw for valid JSON but invalid document", () => {
    expect(() => Document.fromJSON('{"foo": "bar"}')).toThrow(OpenVexValidationError);
  });
});

describe("Document.validate", () => {
  it("should return empty array for valid document", () => {
    const doc = createBasicDoc();
    const issues = Document.validate(doc.toJSON());
    expect(issues).toEqual([]);
  });

  it("should return issues for invalid input", () => {
    const issues = Document.validate({ foo: "bar" });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]?.message).toBeDefined();
    expect(issues[0]?.path).toBeDefined();
  });

  it("should return issues for missing required fields", () => {
    const issues = Document.validate({
      "@context": "https://openvex.dev/ns/v0.2.0",
    });
    expect(issues.length).toBeGreaterThan(0);
  });
});

describe("Document.addStatement", () => {
  it("should return a new document with the added statement", () => {
    const doc = createBasicDoc();
    const updated = doc.addStatement({
      vulnerability: "CVE-2024-0002",
      status: "not_affected",
      products: ["pkg:npm/test-pkg@1.0.0"],
      justification: "vulnerable_code_not_present",
    });

    expect(updated.getStatements()).toHaveLength(2);
    expect(doc.getStatements()).toHaveLength(1);
  });

  it("should increment version", () => {
    const doc = createBasicDoc();
    const updated = doc.addStatement({
      vulnerability: "CVE-2024-0002",
      status: "fixed",
      products: ["pkg:npm/test-pkg@2.0.0"],
    });

    expect(doc.toJSON().version).toBe(1);
    expect(updated.toJSON().version).toBe(2);
  });

  it("should set last_updated", () => {
    const doc = createBasicDoc();
    const updated = doc.addStatement({
      vulnerability: "CVE-2024-0002",
      status: "fixed",
      products: ["pkg:npm/test-pkg@2.0.0"],
    });

    expect(updated.toJSON().last_updated).toBeDefined();
  });
});

describe("Document.merge", () => {
  it("should merge multiple documents", () => {
    const doc1 = Document.create({
      author: "Author 1",
      statements: [{ vulnerability: "CVE-2024-0001", status: "fixed", products: ["pkg:npm/a@1.0.0"] }],
    });
    const doc2 = Document.create({
      author: "Author 2",
      statements: [{ vulnerability: "CVE-2024-0002", status: "fixed", products: ["pkg:npm/b@1.0.0"] }],
    });

    const merged = Document.merge([doc1, doc2], { author: "Merged Author" });
    expect(merged.getStatements()).toHaveLength(2);
    expect(merged.toJSON().author).toBe("Merged Author");
    expect(merged.toJSON().version).toBe(1);
  });

  it("should use first document author if none provided", () => {
    const doc = createBasicDoc({ author: "First" });
    const merged = Document.merge([doc]);
    expect(merged.toJSON().author).toBe("First");
  });

  it("should throw for empty array", () => {
    expect(() => Document.merge([])).toThrow(OpenVexValidationError);
  });
});

describe("Document query helpers", () => {
  const doc = Document.create({
    author: "Test",
    statements: [
      { vulnerability: "CVE-2024-0001", status: "fixed", products: ["pkg:npm/a@1.0.0"] },
      { vulnerability: "CVE-2024-0002", status: "affected", products: ["pkg:npm/b@1.0.0"], actionStatement: "Upgrade" },
      {
        vulnerability: "CVE-2024-0001",
        status: "not_affected",
        products: ["pkg:npm/b@1.0.0"],
        justification: "component_not_present",
      },
    ],
  });

  it("getStatements returns all statements", () => {
    expect(doc.getStatements()).toHaveLength(3);
  });

  it("getStatementsByVulnerability filters by vuln name", () => {
    const stmts = doc.getStatementsByVulnerability("CVE-2024-0001");
    expect(stmts).toHaveLength(2);
  });

  it("getStatementsByStatus filters by status", () => {
    expect(doc.getStatementsByStatus("fixed")).toHaveLength(1);
    expect(doc.getStatementsByStatus("affected")).toHaveLength(1);
    expect(doc.getStatementsByStatus("not_affected")).toHaveLength(1);
    expect(doc.getStatementsByStatus("under_investigation")).toHaveLength(0);
  });

  it("getStatementsByProduct filters by product @id", () => {
    const stmts = doc.getStatementsByProduct("pkg:npm/b@1.0.0");
    expect(stmts).toHaveLength(2);
  });

  it("returns cloned data that cannot mutate internal state", () => {
    const stmts = doc.getStatements();
    (stmts[0] as Record<string, unknown>)["status"] = "hacked";
    expect(doc.getStatements()[0]?.status).toBe("fixed");
  });
});

describe("Document.create with tooling", () => {
  it("should include tooling in the document", () => {
    const doc = Document.create({
      author: "Test",
      tooling: "openvex-js/1.0.0",
      statements: [{ vulnerability: "CVE-2024-0001", status: "fixed", products: ["pkg:npm/a@1.0.0"] }],
    });
    expect(doc.toJSON().tooling).toBe("openvex-js/1.0.0");
  });
});

describe("Vulnerability object input", () => {
  it("should accept object vulnerability with description", () => {
    const doc = Document.create({
      author: "Test",
      statements: [
        {
          vulnerability: {
            name: "CVE-2024-0001",
            description: "A buffer overflow vulnerability",
            aliases: ["GHSA-xxxx"],
          },
          status: "fixed",
          products: ["pkg:npm/a@1.0.0"],
        },
      ],
    });

    const stmt = doc.getStatements()[0];
    expect(stmt?.vulnerability.name).toBe("CVE-2024-0001");
    expect(stmt?.vulnerability.description).toBe("A buffer overflow vulnerability");
    expect(stmt?.vulnerability.aliases).toEqual(["GHSA-xxxx"]);
  });
});

describe("Error handling consistency", () => {
  it("should throw OpenVexValidationError for empty statements", () => {
    expect(() => Document.create({ statements: [] })).toThrow(OpenVexValidationError);
  });

  it("should throw OpenVexValidationError for invalid statement", () => {
    expect(() =>
      Document.create({
        statements: [
          {
            vulnerability: "CVE-2024-0001",
            status: "not_affected",
            products: ["pkg:npm/a@1.0.0"],
          },
        ],
      }),
    ).toThrow(OpenVexValidationError);
  });

  it("Document.parse throws OpenVexValidationError", () => {
    expect(() => Document.parse({})).toThrow(OpenVexValidationError);
  });

  it("OpenVexValidationError includes issues array", () => {
    try {
      Document.parse({});
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(OpenVexValidationError);
      const validationErr = err as InstanceType<typeof OpenVexValidationError>;
      expect(validationErr.issues).toBeDefined();
      expect(validationErr.issues?.length).toBeGreaterThan(0);
    }
  });
});

describe("Deep freeze", () => {
  it("toJSON returns mutable clone", () => {
    const doc = createBasicDoc();
    const data = doc.toJSON() as Record<string, unknown>;
    data["author"] = "Modified";
    expect(data["author"]).toBe("Modified");
    expect(doc.toJSON().author).toBe("Test Author");
  });
});
