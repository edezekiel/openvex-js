import { createHash } from "node:crypto";
import { Temporal } from "@js-temporal/polyfill";
import type { CreateDocumentOptions } from "./create-options.js";
import type {
  AffectedStatement,
  Component,
  FixedOrUnderInvestigationStatement,
  NotAffectedStatement,
  OpenVexDocument,
  Statement,
  StatementStatus,
  Vulnerability,
} from "./schemas.js";

/**
 * Generate a canonical document ID based on the document content
 * Mimics vexctl's GenerateCanonicalID behavior
 */
function generateCanonicalId(doc: Omit<OpenVexDocument, "@id">): string {
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

function getCurrentTimestamp(): string {
  return Temporal.Now.instant().toString();
}

/**
 * Create a product/component from a string identifier
 * Only purl, cpe22, and cpe23 are allowed per OpenVEX spec
 */
export function createProduct(identifier: string): Component {
  if (identifier.startsWith("pkg:")) {
    return { "@id": identifier };
  }
  if (identifier.startsWith("cpe:2.2:")) {
    return { identifiers: { cpe22: identifier } };
  }
  if (identifier.startsWith("cpe:2.3:")) {
    return { identifiers: { cpe23: identifier } };
  }
  throw new Error(
    `Invalid identifier type: "${identifier}". Only purl (pkg:...), cpe22 (cpe:2.2:...), and cpe23 (cpe:2.3:...) are allowed.`,
  );
}

export function createVulnerability(name: string, aliases?: string[]): Vulnerability {
  const vuln: Vulnerability = { name };
  if (aliases && aliases.length > 0) {
    vuln.aliases = aliases;
  }
  return vuln;
}

/**
 * Create a statement from options
 * @param options - Options for creating the statement
 * @param timestamp - Timestamp to use for the statement
 */
function createStatementFromOptions(options: CreateDocumentOptions, timestamp: string): Statement {
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

  const vulnerability = createVulnerability(options.vulnerability, options.aliases);

  const baseStatement: {
    vulnerability: Vulnerability;
    products: Component[];
    status: StatementStatus;
    timestamp: string;
    supplier?: string;
    status_notes?: string;
  } = {
    vulnerability,
    products,
    status: options.status,
    timestamp,
    status_notes: options.statusNote,
  };

  if (options.supplier !== undefined) {
    baseStatement.supplier = options.supplier;
  }

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

  const stmt: FixedOrUnderInvestigationStatement = {
    ...baseStatement,
    status: options.status,
  };
  return stmt;
}

/**
 * Create an OpenVEX document from options
 * Uses a single timestamp for both document and statement
 */
export function createDocument(options: CreateDocumentOptions): OpenVexDocument {
  if (!options.author) {
    throw new Error("author is required");
  }

  const timestamp = getCurrentTimestamp();
  const statement = createStatementFromOptions(options, timestamp);

  const doc: Omit<OpenVexDocument, "@id"> = {
    "@context": "https://openvex.dev/ns/v0.2.0",
    author: options.author,
    role: options.role,
    timestamp,
    version: 1,
    statements: [statement],
  };

  const id = options.id || generateCanonicalId(doc);

  return {
    ...doc,
    "@id": id,
  };
}
