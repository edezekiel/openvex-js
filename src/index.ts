/**
 * Get the OpenVEX context URL for a given version
 * @param version - The OpenVEX version (default: "v0.2.0")
 */
export function getOpenVexContext(version = "v0.2.0"): string {
  return `https://openvex.dev/ns/${version}`;
}

/**
 * Get the library version
 */
export function getVersion(): string {
  return "0.0.0";
}

export type {
  CreateDocumentOptions,
  CreateStatementOptions,
  ProductInput,
  SubcomponentInput,
} from "./create-options.js";
export { createDocument, createProduct, createStatement, createSubcomponent, createVulnerability } from "./document.js";
export { OpenVexValidationError, type ValidationIssue } from "./errors.js";
export { parseOpenVexDocument, parseOpenVexDocumentFromUnknown } from "./parse.js";
export type {
  AffectedStatement,
  Component,
  FixedOrUnderInvestigationStatement,
  HashAlgorithm,
  Hashes,
  Identifiers,
  Justification,
  NotAffectedStatement,
  OpenVexDocument,
  Statement,
  StatementStatus,
  Subcomponent,
  Vulnerability,
} from "./schemas.js";
