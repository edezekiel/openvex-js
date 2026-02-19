export { Component } from "./classes/component.js";
export type {
  CreateDocumentOptions,
  CreateStatementOptions,
  ProductInput,
  SubcomponentInput,
  VulnerabilityInput,
} from "./classes/document.js";
export { Document } from "./classes/document.js";
export { Statement } from "./classes/statement.js";
export type { CreateVulnerabilityOptions } from "./classes/vulnerability.js";
export { Vulnerability } from "./classes/vulnerability.js";
export { OpenVexValidationError, type ValidationIssue } from "./errors.js";
export type {
  ComponentData,
  HashAlgorithm,
  Hashes,
  Identifiers,
  Justification,
  OpenVexDocumentData,
  StatementData,
  StatementStatus,
  SubcomponentData,
  VulnerabilityData,
} from "./schemas.js";
// Note: Zod schemas (openVexDocumentSchema, statementSchema) are not re-exported
// from the main entry point due to DTS generation limitations with complex union types.
// Power users can import them directly: import { statementSchema } from "openvex-js/schemas"
