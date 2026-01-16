import type { Justification, StatementStatus } from "./schemas.js";

export interface CreateDocumentOptions {
  /** Document author (required) */
  author: string;
  /** Vulnerability identifier, e.g. CVE-2023-12345 (required) */
  vulnerability: string;
  /** Statement status (required) */
  status: StatementStatus;
  /** Single product identifier (purl, cpe22, or cpe23). Either product or products must be provided. */
  product?: string;
  /** Multiple product identifiers. Either product or products must be provided. */
  products?: string[];
  /** Author's role */
  role?: string;
  /** Justification for not_affected status */
  justification?: Justification;
  /** Action statement for affected status */
  actionStatement?: string;
  /** Impact statement for not_affected status */
  impactStatement?: string;
  /** Additional status notes */
  statusNote?: string;
  /** Vulnerability aliases */
  aliases?: string[];
  /** Custom document ID (auto-generated if not provided) */
  id?: string;
  /** Supplier information */
  supplier?: string;
  /** Subcomponent identifiers (attached to the first product) */
  subcomponents?: string[];
}
