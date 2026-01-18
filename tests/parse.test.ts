import { describe, expect, it } from "vitest";
import { DocumentBuilder } from "../src/index.js";
import { loadFixture, validVexctlFixtureTests } from "./helpers/fixtures.js";
import { normalizeDocument, runVexCtlCreate } from "./helpers/vexctl.js";

function expectParseMatchesOriginal(fixturePath: string): void {
  const fixture = loadFixture(fixturePath);
  if (!fixture.vexctl) {
    throw new Error(`Fixture ${fixturePath} does not have vexctl options`);
  }
  const originalDoc = runVexCtlCreate(fixture.vexctl);
  const normalizedOriginal = normalizeDocument(originalDoc);

  const parsedDoc = DocumentBuilder.parse(originalDoc);
  const normalizedParsed = normalizeDocument(parsedDoc.toData());

  expect(normalizedParsed).toEqual(normalizedOriginal);
}

describe("parseDocumentBuilder", () => {
  it.each(validVexctlFixtureTests)("should parse $description", ({ fixture }) => {
    expectParseMatchesOriginal(fixture);
  });

  it("should throw error for invalid input", () => {
    expect(() => DocumentBuilder.parse("not an object" as unknown)).toThrow();
  });

  it("should throw error for missing required fields", () => {
    const invalid = JSON.parse('{"@context": "https://openvex.dev/ns/v0.2.0"}');
    expect(() => DocumentBuilder.parse(invalid)).toThrow();
  });
});
