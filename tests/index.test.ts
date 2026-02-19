import { describe, expect, it } from "vitest";
import type {
  ComponentData,
  CreateDocumentOptions,
  CreateStatementOptions,
  CreateVulnerabilityOptions,
  Hashes,
  Identifiers,
  Justification,
  OpenVexDocumentData,
  ProductInput,
  StatementData,
  StatementStatus,
  SubcomponentData,
  SubcomponentInput,
  VulnerabilityData,
  VulnerabilityInput,
} from "../src/index.js";
import { Component, Document, OpenVexValidationError, Statement, Vulnerability } from "../src/index.js";

describe("OpenVEX Library exports", () => {
  it("should export Document class", () => {
    expect(Document).toBeDefined();
    expect(typeof Document.create).toBe("function");
    expect(typeof Document.parse).toBe("function");
    expect(typeof Document.fromJSON).toBe("function");
    expect(typeof Document.validate).toBe("function");
    expect(typeof Document.merge).toBe("function");
  });

  it("should export Statement class", () => {
    expect(Statement).toBeDefined();
    expect(typeof Statement.create).toBe("function");
  });

  it("should export Component class", () => {
    expect(Component).toBeDefined();
    expect(typeof Component.create).toBe("function");
  });

  it("should export Vulnerability class", () => {
    expect(Vulnerability).toBeDefined();
    expect(typeof Vulnerability.create).toBe("function");
  });

  it("should export OpenVexValidationError", () => {
    expect(OpenVexValidationError).toBeDefined();
    const err = new OpenVexValidationError("test");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("OpenVexValidationError");
  });

  it("should export types (compile-time check)", () => {
    // These are type-only exports; this test verifies they are importable
    const _types: [
      ComponentData | undefined,
      CreateDocumentOptions | undefined,
      CreateStatementOptions | undefined,
      CreateVulnerabilityOptions | undefined,
      Hashes | undefined,
      Identifiers | undefined,
      Justification | undefined,
      OpenVexDocumentData | undefined,
      ProductInput | undefined,
      StatementData | undefined,
      StatementStatus | undefined,
      SubcomponentData | undefined,
      SubcomponentInput | undefined,
      VulnerabilityData | undefined,
      VulnerabilityInput | undefined,
    ] = Array(15).fill(undefined) as never;
    expect(_types).toBeDefined();
  });
});
