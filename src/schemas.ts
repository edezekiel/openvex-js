/**
 * Zod schemas for parsing OpenVEX documents
 * Based on OpenVEX JSON Schema v0.2.0
 */
import { Temporal } from "@js-temporal/polyfill";
import { z } from "zod";

/**
 * Custom date-time validator that accepts ISO 8601 with nanoseconds
 */
const dateTimeSchema = z.string().refine(
  (input: string) => {
    try {
      Temporal.Instant.from(input);
      return true;
    } catch {
      return false;
    }
  },
  { message: "Invalid date-time format" },
);

const hashesSchema = z.object({
  md5: z.string().optional(),
  sha1: z.string().optional(),
  "sha-256": z.string().optional(),
  "sha-384": z.string().optional(),
  "sha-512": z.string().optional(),
  "sha3-224": z.string().optional(),
  "sha3-256": z.string().optional(),
  "sha3-384": z.string().optional(),
  "sha3-512": z.string().optional(),
  "blake2s-256": z.string().optional(),
  "blake2b-256": z.string().optional(),
  "blake2b-512": z.string().optional(),
});

/**
 * Schema for identifiers (at least one required)
 */
const identifiersSchema = z
  .object({
    purl: z.string().optional(),
    cpe22: z.string().optional(),
    cpe23: z.string().optional(),
  })
  .refine((input: { purl?: string; cpe22?: string; cpe23?: string }) => !!(input.purl || input.cpe22 || input.cpe23), {
    message: "At least one identifier (purl, cpe22, or cpe23) is required",
  });

const subcomponentSchema = z
  .object({
    "@id": z.string().url().optional(),
    identifiers: identifiersSchema.optional(),
    hashes: hashesSchema.optional(),
  })
  .refine(
    (input: {
      "@id"?: string;
      identifiers?: z.infer<typeof identifiersSchema>;
      hashes?: z.infer<typeof hashesSchema>;
    }) => !!(input["@id"] || input.identifiers),
    {
      message: "Subcomponent must have either @id or identifiers",
    },
  );

const componentSchema = z
  .object({
    "@id": z.string().url().optional(),
    identifiers: identifiersSchema.optional(),
    hashes: hashesSchema.optional(),
    subcomponents: z.array(subcomponentSchema).optional(),
  })
  .refine(
    (input: {
      "@id"?: string;
      identifiers?: z.infer<typeof identifiersSchema>;
      hashes?: z.infer<typeof hashesSchema>;
      subcomponents?: z.infer<typeof subcomponentSchema>[];
    }) => !!(input["@id"] || input.identifiers),
    {
      message: "Component must have either @id or identifiers",
    },
  );

const vulnerabilitySchema = z.object({
  "@id": z.string().url().optional(),
  name: z.string(),
  description: z.string().optional(),
  aliases: z.array(z.string()).optional(),
});

const statementStatusSchema = z.enum(["not_affected", "affected", "fixed", "under_investigation"]);

const justificationSchema = z.enum([
  "component_not_present",
  "vulnerable_code_not_present",
  "vulnerable_code_not_in_execute_path",
  "vulnerable_code_cannot_be_controlled_by_adversary",
  "inline_mitigations_already_exist",
]);

/**
 * Schema for not_affected statement (requires justification or impact_statement)
 */
const notAffectedStatementSchema = z
  .object({
    "@id": z.string().url().optional(),
    version: z.number().min(1).optional(),
    vulnerability: vulnerabilitySchema,
    timestamp: dateTimeSchema.optional(),
    last_updated: dateTimeSchema.optional(),
    products: z.array(componentSchema).optional(),
    status: z.literal("not_affected"),
    supplier: z.string().optional(),
    status_notes: z.string().optional(),
    justification: justificationSchema.optional(),
    impact_statement: z.string().optional(),
  })
  .refine(
    (input: {
      "@id"?: string;
      version?: number;
      vulnerability: z.infer<typeof vulnerabilitySchema>;
      timestamp?: z.infer<typeof dateTimeSchema>;
      last_updated?: z.infer<typeof dateTimeSchema>;
      products?: z.infer<typeof componentSchema>[];
      status: "not_affected";
      supplier?: string;
      status_notes?: string;
      justification?: z.infer<typeof justificationSchema>;
      impact_statement?: string;
    }) => !!(input.justification || input.impact_statement),
    {
      message: "not_affected status requires either justification or impact_statement",
    },
  );

/**
 * Schema for affected statement (requires action_statement)
 */
const affectedStatementSchema = z.object({
  "@id": z.string().url().optional(),
  version: z.number().min(1).optional(),
  vulnerability: vulnerabilitySchema,
  timestamp: dateTimeSchema.optional(),
  last_updated: dateTimeSchema.optional(),
  products: z.array(componentSchema).optional(),
  status: z.literal("affected"),
  supplier: z.string().optional(),
  status_notes: z.string().optional(),
  action_statement: z.string(),
  action_statement_timestamp: dateTimeSchema.optional(),
});

const fixedOrUnderInvestigationStatementSchema = z.object({
  "@id": z.string().url().optional(),
  version: z.number().min(1).optional(),
  vulnerability: vulnerabilitySchema,
  timestamp: dateTimeSchema.optional(),
  last_updated: dateTimeSchema.optional(),
  products: z.array(componentSchema).optional(),
  status: z.enum(["fixed", "under_investigation"]),
  supplier: z.string().optional(),
  status_notes: z.string().optional(),
});

/**
 * Schema for any statement (union of all statement types)
 */
export const statementSchema = z.union([
  notAffectedStatementSchema,
  affectedStatementSchema,
  fixedOrUnderInvestigationStatementSchema,
]);

export const openVexDocumentSchema = z.object({
  "@context": z.string().url(),
  "@id": z.string().url(),
  author: z.string(),
  role: z.string().optional(),
  timestamp: dateTimeSchema,
  last_updated: dateTimeSchema.optional(),
  version: z.number().min(1),
  tooling: z.string().optional(),
  statements: z.array(statementSchema).min(1),
});

export type StatementStatus = z.infer<typeof statementStatusSchema>;
export type Justification = z.infer<typeof justificationSchema>;
export type HashAlgorithm = keyof z.infer<typeof hashesSchema>;
export type Hashes = z.infer<typeof hashesSchema>;
export type Identifiers = z.infer<typeof identifiersSchema>;
export type Subcomponent = z.infer<typeof subcomponentSchema>;
export type Component = z.infer<typeof componentSchema>;
export type Vulnerability = z.infer<typeof vulnerabilitySchema>;
export type NotAffectedStatement = z.infer<typeof notAffectedStatementSchema>;
export type AffectedStatement = z.infer<typeof affectedStatementSchema>;
export type FixedOrUnderInvestigationStatement = z.infer<typeof fixedOrUnderInvestigationStatementSchema>;
export type Statement = z.infer<typeof statementSchema>;
export type OpenVexDocument = z.infer<typeof openVexDocumentSchema>;
