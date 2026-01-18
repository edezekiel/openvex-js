import { describe, expect, it } from "vitest";
import { OpenVexDocument } from "../src/index.js";
import { loadFixture, validVexctlFixtureTests } from "./helpers/fixtures.js";
import { normalizeDocument, runVexCtlCreate } from "./helpers/vexctl.js";

function expectParseMatchesOriginal(fixturePath: string): void {
  const fixture = loadFixture(fixturePath);
  if (!fixture.vexctl) {
    throw new Error(`Fixture ${fixturePath} does not have vexctl options`);
  }
  const originalDoc = runVexCtlCreate(fixture.vexctl);
  const normalizedOriginal = normalizeDocument(originalDoc);

  const parsedDoc = OpenVexDocument.parse(originalDoc);
  const normalizedParsed = normalizeDocument(parsedDoc.toData());

  expect(normalizedParsed).toEqual(normalizedOriginal);
}

describe("parseOpenVexDocument", () => {
  it.each(validVexctlFixtureTests)("should parse $description", ({ fixture }) => {
    expectParseMatchesOriginal(fixture);
  });

  it("should throw error for invalid input", () => {
    expect(() => OpenVexDocument.parse("not an object" as unknown)).toThrow();
  });

  it("should throw error for missing required fields", () => {
    const invalid = JSON.parse('{"@context": "https://openvex.dev/ns/v0.2.0"}');
    expect(() => OpenVexDocument.parse(invalid)).toThrow();
  });
});
