/**
 * Valibot schemas for parsing OpenVEX documents
 * Based on OpenVEX JSON Schema v0.2.0
 */
import { Temporal } from "@js-temporal/polyfill";
import * as v from "valibot";

/**
 * Custom date-time validator that accepts ISO 8601 with nanoseconds
 */
const dateTimeSchema = v.pipe(
  v.string(),
  v.check((input) => {
    try {
      Temporal.Instant.from(input);
      return true;
    } catch {
      return false;
    }
  }, "Invalid date-time format"),
);

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

const vulnerabilitySchema = v.object({
  "@id": v.optional(v.pipe(v.string(), v.url())),
  name: v.string(),
  description: v.optional(v.string()),
  aliases: v.optional(v.array(v.string())),
});

const statementStatusSchema = v.union([
  v.literal("not_affected"),
  v.literal("affected"),
  v.literal("fixed"),
  v.literal("under_investigation"),
]);

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

export type StatementStatus = v.InferOutput<typeof statementStatusSchema>;
export type Justification = v.InferOutput<typeof justificationSchema>;
export type HashAlgorithm = keyof v.InferOutput<typeof hashesSchema>;
export type Hashes = v.InferOutput<typeof hashesSchema>;
export type Identifiers = v.InferOutput<typeof identifiersSchema>;
export type Subcomponent = v.InferOutput<typeof subcomponentSchema>;
export type Component = v.InferOutput<typeof componentSchema>;
export type Vulnerability = v.InferOutput<typeof vulnerabilitySchema>;
export type NotAffectedStatement = v.InferOutput<typeof notAffectedStatementSchema>;
export type AffectedStatement = v.InferOutput<typeof affectedStatementSchema>;
export type FixedOrUnderInvestigationStatement = v.InferOutput<typeof fixedOrUnderInvestigationStatementSchema>;
export type Statement = v.InferOutput<typeof statementSchema>;
export type OpenVexDocument = v.InferOutput<typeof openVexDocumentSchema>;
