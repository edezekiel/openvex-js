/**
 * TypeScript type definitions for OpenVEX documents
 * Based on OpenVEX JSON Schema v0.2.0
 */

/**
 * Status values for VEX statements
 */
export type StatementStatus = "not_affected" | "affected" | "fixed" | "under_investigation";

/**
 * Justification values for not_affected status
 */
export type Justification =
  | "component_not_present"
  | "vulnerable_code_not_present"
  | "vulnerable_code_not_in_execute_path"
  | "vulnerable_code_cannot_be_controlled_by_adversary"
  | "inline_mitigations_already_exist";

/**
 * Hash algorithm types
 */
export type HashAlgorithm =
  | "md5"
  | "sha1"
  | "sha-256"
  | "sha-384"
  | "sha-512"
  | "sha3-224"
  | "sha3-256"
  | "sha3-384"
  | "sha3-512"
  | "blake2s-256"
  | "blake2b-256"
  | "blake2b-512";

/**
 * Map of hash algorithms to hash values
 */
export type Hashes = Partial<Record<HashAlgorithm, string>>;

/**
 * Product identifiers (at least one required)
 */
export interface Identifiers {
  purl?: string;
  cpe22?: string;
  cpe23?: string;
}

/**
 * Subcomponent structure
 */
export interface Subcomponent {
  "@id"?: string;
  identifiers?: Identifiers;
  hashes?: Hashes;
}

/**
 * Component/Product structure
 */
export interface Component {
  "@id"?: string;
  identifiers?: Identifiers;
  hashes?: Hashes;
  subcomponents?: Subcomponent[];
}

/**
 * Vulnerability structure
 */
export interface Vulnerability {
  "@id"?: string;
  name: string;
  description?: string;
  aliases?: string[];
}

/**
 * Base statement structure (without conditional fields)
 */
export interface BaseStatement {
  "@id"?: string;
  version?: number;
  vulnerability: Vulnerability;
  timestamp?: string;
  last_updated?: string;
  products?: Component[];
  status: StatementStatus;
  supplier?: string;
  status_notes?: string;
}

/**
 * Statement with not_affected status (requires justification or impact_statement)
 */
export interface NotAffectedStatement extends BaseStatement {
  status: "not_affected";
  justification?: Justification;
  impact_statement?: string;
}

/**
 * Statement with affected status (requires action_statement)
 */
export interface AffectedStatement extends BaseStatement {
  status: "affected";
  action_statement: string;
  action_statement_timestamp?: string;
}

/**
 * Statement with fixed or under_investigation status
 */
export interface FixedOrUnderInvestigationStatement extends BaseStatement {
  status: "fixed" | "under_investigation";
}

/**
 * Union type for all statement types
 */
export type Statement = NotAffectedStatement | AffectedStatement | FixedOrUnderInvestigationStatement;

/**
 * OpenVEX document structure
 */
export interface OpenVexDocument {
  "@context": string;
  "@id": string;
  author: string;
  role?: string;
  timestamp: string;
  last_updated?: string;
  version: number;
  tooling?: string;
  statements: Statement[];
}
