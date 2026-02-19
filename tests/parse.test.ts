import { describe, expect, it } from "vitest";
import { Document } from "../src/index.js";
import { loadFixture, validVexctlFixtureTests } from "./helpers/fixtures.js";
import { normalizeDocument, runVexCtlCreate } from "./helpers/vexctl.js";

function expectParseMatchesOriginal(fixturePath: string): void {
  const fixture = loadFixture(fixturePath);
  if (!fixture.vexctl) {
    throw new Error(`Fixture ${fixturePath} does not have vexctl options`);
  }
  const originalDoc = runVexCtlCreate(fixture.vexctl);
  const normalizedOriginal = normalizeDocument(originalDoc);

  const parsedDoc = Document.parse(originalDoc);
  const normalizedParsed = normalizeDocument(parsedDoc.toJSON());

  expect(normalizedParsed).toEqual(normalizedOriginal);
}

describe("parseDocument", () => {
  it.each(validVexctlFixtureTests)("should parse $description", ({ fixture }) => {
    expectParseMatchesOriginal(fixture);
  });

  it("should throw error for invalid input", () => {
    expect(() => Document.parse("not an object" as unknown)).toThrow();
  });

  it("should throw error for missing required fields", () => {
    const invalid = JSON.parse('{"@context": "https://openvex.dev/ns/v0.2.0"}');
    expect(() => Document.parse(invalid)).toThrow();
  });

  it("should preserve unknown properties at document root", () => {
    const fixture = loadFixture("create/basic-fixed.json");
    // biome-ignore lint/style/noNonNullAssertion: fixture is known to have vexctl options
    const vexctlDoc = runVexCtlCreate(fixture.vexctl!) as Record<string, unknown>;
    const docWithExtra = { ...vexctlDoc, test: "extra-property-value" };

    const parsed = Document.parse(docWithExtra);
    const parsedData = parsed.toJSON() as Record<string, unknown>;

    expect(parsedData["test"]).toBe("extra-property-value");
  });
});
