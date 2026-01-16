import type { Hashes, Justification, Statement, StatementStatus } from "./schemas.js";

/**
 * Flexible subcomponent specification - can be a simple string identifier
 * or an object with identifier and optional hashes
 */
export type SubcomponentInput = string | { id: string; hashes?: Hashes };

/**
 * Flexible product specification - can be a simple string identifier
 * or an object with per-product subcomponents and/or hashes
 */
export type ProductInput =
  | string
  | {
      id: string;
      subcomponents?: SubcomponentInput[];
      hashes?: Hashes;
    };

/**
 * Options for creating a VEX statement (statement-level concerns)
 */
export interface CreateStatementOptions {
  /** Vulnerability identifier, e.g. CVE-2023-12345 */
  vulnerability: string;
  /** Statement status */
  status: StatementStatus;
  /** Product identifiers - each can have its own subcomponents */
  products: ProductInput[];
  /** Vulnerability aliases */
  aliases?: string[];
  /** Justification for not_affected status */
  justification?: Justification;
  /** Action statement for affected status */
  actionStatement?: string;
  /** Impact statement for not_affected status */
  impactStatement?: string;
  /** Additional status notes */
  statusNote?: string;
  /** Supplier information */
  supplier?: string;
}

/**
 * Options for creating a VEX document (document-level concerns)
 */
export interface CreateDocumentOptions {
  /** Document author */
  author: string;
  /** Author's role */
  role?: string;
  /** Custom document ID (auto-generated if not provided) */
  id?: string;
  /** Statements - can be CreateStatementOptions or pre-built Statement objects */
  statements: (Statement | CreateStatementOptions)[];
}
