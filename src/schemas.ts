/**
 * Valibot schemas for parsing OpenVEX documents
 * Based on OpenVEX JSON Schema v0.2.0
 */

import * as v from "valibot";

/**
 * Custom date-time validator that accepts ISO 8601 with nanoseconds
 */
const dateTimeSchema = v.pipe(
  v.string(),
  v.check((input) => {
    // Accept ISO 8601 dates, including those with nanoseconds
    const date = new Date(input);
    return !Number.isNaN(date.getTime());
  }, "Invalid date-time format"),
);

/**
 * Schema for hashes object
 */
const hashesSchema = v.object({
  md5: v.optional(v.string()),
  sha1: v.optional(v.string()),
  "sha-256": v.optional(v.string()),
  "sha-384": v.optional(v.string()),
  "sha-512": v.optional(v.string()),
  "sha3-224": v.optional(v.string()),
  "sha3-256": v.optional(v.string()),
  "sha3-384": v.optional(v.string()),
  "sha3-512": v.optional(v.string()),
  "blake2s-256": v.optional(v.string()),
  "blake2b-256": v.optional(v.string()),
  "blake2b-512": v.optional(v.string()),
});

/**
 * Schema for identifiers (at least one required)
 */
const identifiersSchema = v.pipe(
  v.object({
    purl: v.optional(v.string()),
    cpe22: v.optional(v.string()),
    cpe23: v.optional(v.string()),
  }),
  v.check((input) => {
    return !!(input.purl || input.cpe22 || input.cpe23);
  }, "At least one identifier (purl, cpe22, or cpe23) is required"),
);

/**
 * Schema for subcomponent
 */
const subcomponentSchema = v.pipe(
  v.object({
    "@id": v.optional(v.pipe(v.string(), v.url())),
    identifiers: v.optional(identifiersSchema),
    hashes: v.optional(hashesSchema),
  }),
  v.check((input) => {
    return !!(input["@id"] || input.identifiers);
  }, "Subcomponent must have either @id or identifiers"),
);

/**
 * Schema for component/product
 */
const componentSchema = v.pipe(
  v.object({
    "@id": v.optional(v.pipe(v.string(), v.url())),
    identifiers: v.optional(identifiersSchema),
    hashes: v.optional(hashesSchema),
    subcomponents: v.optional(v.array(subcomponentSchema)),
  }),
  v.check((input) => {
    return !!(input["@id"] || input.identifiers);
  }, "Component must have either @id or identifiers"),
);

/**
 * Schema for vulnerability
 */
const vulnerabilitySchema = v.object({
  "@id": v.optional(v.pipe(v.string(), v.url())),
  name: v.string(),
  description: v.optional(v.string()),
  aliases: v.optional(v.array(v.string())),
});

/**
 * Schema for statement status
 * Used to derive the StatementStatus type
 */
const statementStatusSchema = v.union([
  v.literal("not_affected"),
  v.literal("affected"),
  v.literal("fixed"),
  v.literal("under_investigation"),
]);

/**
 * Schema for justification
 */
const justificationSchema = v.picklist([
  "component_not_present",
  "vulnerable_code_not_present",
  "vulnerable_code_not_in_execute_path",
  "vulnerable_code_cannot_be_controlled_by_adversary",
  "inline_mitigations_already_exist",
]);

/**
 * Schema for not_affected statement (requires justification or impact_statement)
 */
const notAffectedStatementSchema = v.pipe(
  v.object({
    "@id": v.optional(v.pipe(v.string(), v.url())),
    version: v.optional(v.pipe(v.number(), v.minValue(1))),
    vulnerability: vulnerabilitySchema,
    timestamp: v.optional(dateTimeSchema),
    last_updated: v.optional(dateTimeSchema),
    products: v.optional(v.array(componentSchema)),
    status: v.literal("not_affected"),
    supplier: v.optional(v.string()),
    status_notes: v.optional(v.string()),
    justification: v.optional(justificationSchema),
    impact_statement: v.optional(v.string()),
  }),
  v.check((input) => {
    return !!(input.justification || input.impact_statement);
  }, "not_affected status requires either justification or impact_statement"),
);

/**
 * Schema for affected statement (requires action_statement)
 */
const affectedStatementSchema = v.object({
  "@id": v.optional(v.pipe(v.string(), v.url())),
  version: v.optional(v.pipe(v.number(), v.minValue(1))),
  vulnerability: vulnerabilitySchema,
  timestamp: v.optional(dateTimeSchema),
  last_updated: v.optional(dateTimeSchema),
  products: v.optional(v.array(componentSchema)),
  status: v.literal("affected"),
  supplier: v.optional(v.string()),
  status_notes: v.optional(v.string()),
  action_statement: v.string(),
  action_statement_timestamp: v.optional(dateTimeSchema),
});

/**
 * Schema for fixed or under_investigation statement
 */
const fixedOrUnderInvestigationStatementSchema = v.object({
  "@id": v.optional(v.pipe(v.string(), v.url())),
  version: v.optional(v.pipe(v.number(), v.minValue(1))),
  vulnerability: vulnerabilitySchema,
  timestamp: v.optional(dateTimeSchema),
  last_updated: v.optional(dateTimeSchema),
  products: v.optional(v.array(componentSchema)),
  status: v.union([v.literal("fixed"), v.literal("under_investigation")]),
  supplier: v.optional(v.string()),
  status_notes: v.optional(v.string()),
});

/**
 * Schema for any statement (union of all statement types)
 */
export const statementSchema = v.union([
  notAffectedStatementSchema,
  affectedStatementSchema,
  fixedOrUnderInvestigationStatementSchema,
]);

/**
 * Schema for OpenVEX document
 */
export const openVexDocumentSchema = v.object({
  "@context": v.pipe(v.string(), v.url()),
  "@id": v.pipe(v.string(), v.url()),
  author: v.string(),
  role: v.optional(v.string()),
  timestamp: dateTimeSchema,
  last_updated: v.optional(dateTimeSchema),
  version: v.pipe(v.number(), v.minValue(1)),
  tooling: v.optional(v.string()),
  statements: v.pipe(v.array(statementSchema), v.minLength(1)),
});

// ============================================================================
// Type Exports - Derived from Schemas (Single Source of Truth)
// ============================================================================

/**
 * Status values for VEX statements
 * Derived from statementStatusSchema
 */
export type StatementStatus = v.InferOutput<typeof statementStatusSchema>;

/**
 * Justification values for not_affected status
 * Derived from justificationSchema
 */
export type Justification = v.InferOutput<typeof justificationSchema>;

/**
 * Hash algorithm types
 * Derived from hashesSchema keys
 */
export type HashAlgorithm = keyof v.InferOutput<typeof hashesSchema>;

/**
 * Map of hash algorithms to hash values
 * Derived from hashesSchema
 */
export type Hashes = v.InferOutput<typeof hashesSchema>;

/**
 * Product identifiers (at least one required)
 * Derived from identifiersSchema
 */
export type Identifiers = v.InferOutput<typeof identifiersSchema>;

/**
 * Subcomponent structure
 * Derived from subcomponentSchema
 */
export type Subcomponent = v.InferOutput<typeof subcomponentSchema>;

/**
 * Component/Product structure
 * Derived from componentSchema
 */
export type Component = v.InferOutput<typeof componentSchema>;

/**
 * Vulnerability structure
 * Derived from vulnerabilitySchema
 */
export type Vulnerability = v.InferOutput<typeof vulnerabilitySchema>;

/**
 * Statement with not_affected status (requires justification or impact_statement)
 * Derived from notAffectedStatementSchema
 */
export type NotAffectedStatement = v.InferOutput<typeof notAffectedStatementSchema>;

/**
 * Statement with affected status (requires action_statement)
 * Derived from affectedStatementSchema
 */
export type AffectedStatement = v.InferOutput<typeof affectedStatementSchema>;

/**
 * Statement with fixed or under_investigation status
 * Derived from fixedOrUnderInvestigationStatementSchema
 */
export type FixedOrUnderInvestigationStatement = v.InferOutput<typeof fixedOrUnderInvestigationStatementSchema>;

/**
 * Union type for all statement types
 * Derived from statementSchema
 */
export type Statement = v.InferOutput<typeof statementSchema>;

/**
 * OpenVEX document structure
 * Derived from openVexDocumentSchema
 */
export type OpenVexDocument = v.InferOutput<typeof openVexDocumentSchema>;
