/**
 * Functions for creating OpenVEX documents
 */

import { createHash } from "node:crypto";
import type { CreateDocumentOptions } from "./create-options.js";
import type {
  AffectedStatement,
  Component,
  FixedOrUnderInvestigationStatement,
  NotAffectedStatement,
  OpenVexDocument,
  Statement,
  Vulnerability,
} from "./types.js";

/**
 * Generate a canonical document ID based on the document content
 * This mimics vexctl's GenerateCanonicalID behavior
 */
function generateCanonicalId(doc: Omit<OpenVexDocument, "@id">): string {
  // Create a deterministic representation of the document
  const docStr = JSON.stringify({
    "@context": doc["@context"],
    author: doc.author,
    role: doc.role,
    version: doc.version,
    statements: doc.statements.map((stmt) => ({
      vulnerability: stmt.vulnerability.name,
      products: stmt.products?.map((p) => p["@id"] || JSON.stringify(p.identifiers)),
      status: stmt.status,
    })),
  });

  const hash = createHash("sha256").update(docStr).digest("hex");
  return `https://openvex.dev/docs/public/vex-${hash}`;
}

/**
 * Get current timestamp in ISO 8601 format
 */
function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Create a product/component from a string identifier (purl, cpe, etc.)
 * According to the OpenVEX spec, only purl, cpe22, and cpe23 are allowed as identifier types.
 */
export function createProduct(identifier: string): Component {
  // If it looks like a purl, use it as @id (purls can also be used as IRIs)
  if (identifier.startsWith("pkg:")) {
    return { "@id": identifier };
  }
  // CPE 2.2 format
  if (identifier.startsWith("cpe:2.2:")) {
    return { identifiers: { cpe22: identifier } };
  }
  // CPE 2.3 format
  if (identifier.startsWith("cpe:2.3:")) {
    return { identifiers: { cpe23: identifier } };
  }
  // If we can't determine the identifier type, throw an error
  // Only purl, cpe22, and cpe23 are allowed according to the spec
  throw new Error(
    `Invalid identifier type: "${identifier}". Only purl (pkg:...), cpe22 (cpe:2.2:...), and cpe23 (cpe:2.3:...) are allowed.`,
  );
}

/**
 * Create a vulnerability from a name and optional aliases
 */
export function createVulnerability(name: string, aliases?: string[]): Vulnerability {
  const vuln: Vulnerability = { name };
  if (aliases && aliases.length > 0) {
    vuln.aliases = aliases;
  }
  return vuln;
}

/**
 * Create a statement from options
 */
function createStatementFromOptions(options: CreateDocumentOptions): Statement {
  if (!options.vulnerability) {
    throw new Error("vulnerability is required");
  }

  if (!options.status) {
    throw new Error("status is required");
  }

  const products: Component[] = [];
  if (options.product) {
    products.push(createProduct(options.product));
  }
  if (options.products) {
    products.push(...options.products.map(createProduct));
  }

  if (products.length === 0) {
    throw new Error("at least one product is required");
  }

  const timestamp = getCurrentTimestamp();
  const vulnerability = createVulnerability(options.vulnerability, options.aliases);

  const baseStatement = {
    vulnerability,
    products,
    status: options.status,
    timestamp,
    supplier: undefined,
    status_notes: options.statusNote,
  };

  if (options.status === "not_affected") {
    if (!options.justification && !options.impactStatement) {
      throw new Error("not_affected status requires either justification or impactStatement");
    }
    const stmt: NotAffectedStatement = {
      ...baseStatement,
      status: "not_affected",
    };
    if (options.justification) {
      stmt.justification = options.justification;
    }
    if (options.impactStatement) {
      stmt.impact_statement = options.impactStatement;
    }
    return stmt;
  }

  if (options.status === "affected") {
    if (!options.actionStatement) {
      throw new Error("affected status requires actionStatement");
    }
    const stmt: AffectedStatement = {
      ...baseStatement,
      status: "affected",
      action_statement: options.actionStatement,
      action_statement_timestamp: timestamp,
    };
    return stmt;
  }

  // fixed or under_investigation
  // At this point, TypeScript knows status is "fixed" | "under_investigation"
  // because we've already handled "not_affected" and "affected"
  const stmt: FixedOrUnderInvestigationStatement = {
    ...baseStatement,
    status: options.status,
  };
  return stmt;
}

/**
 * Create an OpenVEX document from options (similar to vexctl create)
 */
export function createDocument(options: CreateDocumentOptions): OpenVexDocument {
  if (!options.author) {
    throw new Error("author is required");
  }

  const statement = createStatementFromOptions(options);
  const timestamp = getCurrentTimestamp();

  const doc: Omit<OpenVexDocument, "@id"> = {
    "@context": "https://openvex.dev/ns/v0.2.0",
    author: options.author,
    role: options.role,
    timestamp,
    version: 1,
    statements: [statement],
  };

  // Generate ID if not provided
  const id = options.id || generateCanonicalId(doc);

  return {
    ...doc,
    "@id": id,
  };
}
