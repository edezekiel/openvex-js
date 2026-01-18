export { Component } from "./classes/component.js";
export type {
  CreateDocumentOptions,
  CreateStatementOptions,
  ProductInput,
  SubcomponentInput,
} from "./classes/document.js";
export { OpenVexDocument } from "./classes/document.js";
export { Statement } from "./classes/statement.js";
export { Vulnerability } from "./classes/vulnerability.js";
export { OpenVexValidationError, type ValidationIssue } from "./errors.js";
export type {
  AffectedStatement,
  Component as ComponentType,
  FixedStatement,
  HashAlgorithm,
  Hashes,
  Identifiers,
  Justification,
  NotAffectedStatement,
  OpenVexDocument as OpenVexDocumentType,
  Statement as StatementType,
  StatementStatus,
  Subcomponent,
  UnderInvestigationStatement,
  Vulnerability as VulnerabilityType,
} from "./schemas.js";
