import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseOpenVexDocument } from "../src/index.js";
import { runVexCtlCreate, type VexCtlCreateOptions } from "./helpers/vexctl.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Helper to load create test fixtures
 */
function loadFixture(path: string): { description: string; vexctl: VexCtlCreateOptions } {
  const fullPath = join(__dirname, "fixtures", path);
  const content = readFileSync(fullPath, "utf-8");
  return JSON.parse(content) as { description: string; vexctl: VexCtlCreateOptions };
}

describe("parseOpenVexDocument", () => {
  it("should parse basic fixed status document", () => {
    const fixture = loadFixture("create/basic-fixed.json");
    const vexctlDoc = runVexCtlCreate(fixture.vexctl);

    const doc = parseOpenVexDocument(JSON.stringify(vexctlDoc));
    expect(doc["@context"]).toBe("https://openvex.dev/ns/v0.2.0");
    expect(doc.statements).toHaveLength(1);
    expect(doc.statements[0]?.status).toBe("fixed");
  });

  it("should parse document with multiple products", () => {
    const fixture = loadFixture("create/multiple-products.json");
    const vexctlDoc = runVexCtlCreate(fixture.vexctl);

    const doc = parseOpenVexDocument(JSON.stringify(vexctlDoc));
    expect(doc.statements[0]?.products).toHaveLength(2);
  });

  it("should parse not_affected document with justification", () => {
    const fixture = loadFixture("create/not-affected-justification.json");
    const vexctlDoc = runVexCtlCreate(fixture.vexctl);

    const doc = parseOpenVexDocument(JSON.stringify(vexctlDoc));
    expect(doc.statements[0]?.status).toBe("not_affected");
    const stmt = doc.statements[0] as { justification?: string };
    expect(stmt.justification).toBe("component_not_present");
  });

  it("should parse affected document with action statement", () => {
    const fixture = loadFixture("create/affected-action-statement.json");
    const vexctlDoc = runVexCtlCreate(fixture.vexctl);

    const doc = parseOpenVexDocument(JSON.stringify(vexctlDoc));
    expect(doc.statements[0]?.status).toBe("affected");
    const stmt = doc.statements[0] as { action_statement?: string };
    expect(stmt.action_statement).toBeDefined();
  });

  it("should throw error for invalid JSON", () => {
    expect(() => parseOpenVexDocument("invalid json")).toThrow();
  });

  it("should throw error for missing required fields", () => {
    expect(() => parseOpenVexDocument('{"@context": "https://openvex.dev/ns/v0.2.0"}')).toThrow();
  });
});
