// Based on OpenVEX JSON Schema v0.2.0
import { Temporal } from "@js-temporal/polyfill";
import { z } from "zod";

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

const identifiersSchema = z
  .object({
    purl: z.string().optional(),
    cpe22: z.string().optional(),
    cpe23: z.string().optional(),
  })
  .refine((input) => !!(input.purl || input.cpe22 || input.cpe23), {
    message: "At least one identifier (purl, cpe22, or cpe23) is required",
  });

const subcomponentSchema = z
  .object({
    "@id": z.string().url().optional(),
    identifiers: identifiersSchema.optional(),
    hashes: hashesSchema.optional(),
  })
  .refine((input) => !!(input["@id"] || input.identifiers), {
    message: "Subcomponent must have either @id or identifiers",
  });

const componentSchema = z
  .object({
    "@id": z.string().url().optional(),
    identifiers: identifiersSchema.optional(),
    hashes: hashesSchema.optional(),
    subcomponents: z.array(subcomponentSchema).optional(),
  })
  .refine((input) => !!(input["@id"] || input.identifiers), {
    message: "Component must have either @id or identifiers",
  });

const identifierInputSchema = z.string().transform((val, ctx): { "@id": string } => {
  if (val.startsWith("pkg:") || val.startsWith("cpe:2.2:") || val.startsWith("cpe:2.3:")) {
    return { "@id": val };
  }
  ctx.addIssue({
    code: z.ZodIssueCode.custom,
    message: `Invalid identifier: "${val}". Must be purl (pkg:...), cpe22 (cpe:2.2:...), or cpe23 (cpe:2.3:...).`,
  });
  return z.NEVER;
});

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

const baseStatementSchema = z.object({
  "@id": z.string().url().optional(),
  version: z.number().min(1).optional(),
  vulnerability: vulnerabilitySchema,
  timestamp: dateTimeSchema.optional(),
  last_updated: dateTimeSchema.optional(),
  products: z.array(componentSchema).optional(),
  supplier: z.string().optional(),
  status_notes: z.string().optional(),
});

const notAffectedStatementSchema = baseStatementSchema
  .extend({
    status: z.literal("not_affected"),
    justification: justificationSchema.optional(),
    impact_statement: z.string().optional(),
  })
  .strict()
  .refine((s) => s.justification || s.impact_statement, {
    message: "not_affected status requires either justification or impact_statement",
  });

const affectedStatementSchema = baseStatementSchema
  .extend({
    status: z.literal("affected"),
    action_statement: z.string(),
    action_statement_timestamp: dateTimeSchema.optional(),
  })
  .strict();

const fixedStatementSchema = baseStatementSchema
  .extend({
    status: z.literal("fixed"),
  })
  .strict();

const underInvestigationStatementSchema = baseStatementSchema
  .extend({
    status: z.literal("under_investigation"),
  })
  .strict();

export const statementSchema = z.union([
  notAffectedStatementSchema,
  affectedStatementSchema,
  fixedStatementSchema,
  underInvestigationStatementSchema,
]);

const contextSchema = z.string().regex(/^https:\/\/openvex\.dev\/ns\/v\d+\.\d+\.\d+$/, {
  message: "@context must be a valid OpenVEX context URL (https://openvex.dev/ns/v<version>)",
});

export const openVexDocumentSchema = z
  .object({
    "@context": contextSchema,
    "@id": z.string().url(),
    author: z.string(),
    role: z.string().optional(),
    timestamp: dateTimeSchema,
    last_updated: dateTimeSchema.optional(),
    version: z.number().min(1),
    tooling: z.string().optional(),
    statements: z.array(statementSchema).min(1),
  })
  .strict();

export { identifierInputSchema, vulnerabilitySchema };

export type StatementStatus = z.infer<typeof statementStatusSchema>;
export type Justification = z.infer<typeof justificationSchema>;
export type HashAlgorithm = keyof z.infer<typeof hashesSchema>;
export type Hashes = z.infer<typeof hashesSchema>;
export type Identifiers = z.infer<typeof identifiersSchema>;
export type Subcomponent = z.infer<typeof subcomponentSchema>;
export type Component = z.infer<typeof componentSchema>;
export type Vulnerability = z.infer<typeof vulnerabilitySchema>;
export type Statement = z.infer<typeof statementSchema>;
export type OpenVexDocument = z.infer<typeof openVexDocumentSchema>;
