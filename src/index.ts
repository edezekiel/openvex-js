// OpenVEX TypeScript Library
// Main entry point

/**
 * Get the OpenVEX context URL for a given version.
 * @param version - The OpenVEX version (default: "v0.2.0")
 * @returns The context URL for the specified version
 */
export function getOpenVexContext(version = "v0.2.0"): string {
  return `https://openvex.dev/ns/${version}`;
}

/**
 * Get the library version.
 * @returns The current library version
 */
export function getVersion(): string {
  return "0.0.0";
}

// Export create options type
export type { CreateDocumentOptions } from "./create-options.js";

// Export create functions
export { createDocument, createProduct, createVulnerability } from "./document.js";
// Export parse functions
export { parseOpenVexDocument, parseOpenVexDocumentFromUnknown } from "./parse.js";
// Export types
export type {
  AffectedStatement,
  Component,
  Hashes,
  Identifiers,
  Justification,
  NotAffectedStatement,
  OpenVexDocument,
  Statement,
  StatementStatus,
  Subcomponent,
  Vulnerability,
} from "./types.js";
