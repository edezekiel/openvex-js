import { describe, expect, it } from "vitest";
import { ComponentBuilder, DocumentBuilder } from "../src/index.js";
import { loadFixture, vexctlFixtureTests } from "./helpers/fixtures.js";
import { normalizeDocument, runVexCtlCreate, vexctlOptionsToCreateDocumentOptions } from "./helpers/vexctl.js";

function expectMatchesVexCtl(fixturePath: string): void {
  const fixture = loadFixture(fixturePath);

  if (!fixture.vexctl) {
    throw new Error(`Fixture ${fixturePath} does not have vexctl options`);
  }

  const vexctl = fixture.vexctl;
  const library = vexctlOptionsToCreateDocumentOptions(vexctl);

  if (fixture.expectedError) {
    expect(() => DocumentBuilder.create(library)).toThrow(fixture.expectedError);
    expect(() => runVexCtlCreate(vexctl)).toThrow();
  } else {
    const vexctlOutput = runVexCtlCreate(vexctl);
    const normalizedVexCtl = normalizeDocument(vexctlOutput);

    const libraryDoc = DocumentBuilder.create(library);
    const normalizedLibrary = normalizeDocument(libraryDoc.toData());

    expect(normalizedLibrary).toEqual(normalizedVexCtl);
  }
}

function expectValidLibraryDocument(fixturePath: string): void {
  const fixture = loadFixture(fixturePath);

  if (!fixture.library) {
    throw new Error(`Fixture ${fixturePath} does not have library options`);
  }

  const doc = DocumentBuilder.create(fixture.library);

  const parsed = DocumentBuilder.parse(doc.toData());
  expect(parsed.toData()).toEqual(doc.toData());
}

describe("createDocument", () => {
  it.each(vexctlFixtureTests)("should handle $description", ({ fixture }) => {
    expectMatchesVexCtl(fixture);
  });

  it("should throw error for invalid identifier types", () => {
    expect(() => ComponentBuilder.create("invalid-identifier")).toThrow(/Invalid identifier.*invalid-identifier/);
    expect(() => ComponentBuilder.create("pkg:apk/wolfi/git@2.39.0-r1")).not.toThrow();
    expect(() => ComponentBuilder.create("cpe:2.2:o:redhat:enterprise_linux:8")).not.toThrow();
    expect(() => ComponentBuilder.create("cpe:2.3:o:redhat:enterprise_linux:8:*:*:*:*:*:*:*")).not.toThrow();
  });
});

describe("library-only features (not in vexctl)", () => {
  const libraryFixtureTests = [
    {
      fixture: "create/multiple-products-per-product-subcomponents.json",
      description: "multiple products each having subcomponents",
    },
    { fixture: "create/mixed-product-formats.json", description: "mixed product formats (string and object)" },
    {
      fixture: "create/multiple-statements-different-vulns.json",
      description: "multiple statements with different statuses and options",
    },
    {
      fixture: "create/with-hashes-comprehensive.json",
      description: "comprehensive document with multiple products, subcomponents, and hashes",
    },
  ] as const;

  it.each(libraryFixtureTests)("should create valid OpenVEX with $description", ({ fixture }) => {
    expectValidLibraryDocument(fixture);
  });
});
