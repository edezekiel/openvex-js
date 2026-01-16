import { createHash } from "node:crypto";
import { Temporal } from "@js-temporal/polyfill";
import * as v from "valibot";
import type { CreateDocumentOptions, CreateStatementOptions, ProductInput } from "./create-options.js";
import type {
  AffectedStatement,
  Component,
  FixedOrUnderInvestigationStatement,
  NotAffectedStatement,
  OpenVexDocument,
  Statement,
  StatementStatus,
  Subcomponent,
  Vulnerability,
} from "./schemas.js";
import { statementSchema } from "./schemas.js";

/**
 * Generate a canonical document ID based on the document content
 * Mimics vexctl's GenerateCanonicalID behavior
 */
function generateCanonicalId(doc: Omit<OpenVexDocument, "@id">): string {
  // Exclude dynamic fields that shouldn't affect the canonical ID
  const { timestamp, last_updated, ...canonicalDoc } = doc;
  const docStr = JSON.stringify(canonicalDoc);

  const hash = createHash("sha256").update(docStr).digest("hex");
  return `https://openvex.dev/docs/public/vex-${hash}`;
}

function getCurrentTimestamp(): string {
  return Temporal.Now.instant().toString();
}

/**
 * Create a component from a string identifier
 * Only purl, cpe22, and cpe23 are allowed per OpenVEX spec
 */
function createComponentFromIdentifier(identifier: string): Component {
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

/**
 * Create a product/component from a string identifier
 * Only purl, cpe22, and cpe23 are allowed per OpenVEX spec
 */
export function createProduct(identifier: string): Component {
  return createComponentFromIdentifier(identifier);
}

/**
 * Create a subcomponent from a string identifier
 * Only purl, cpe22, and cpe23 are allowed per OpenVEX spec
 */
export function createSubcomponent(identifier: string): Subcomponent {
  return createComponentFromIdentifier(identifier);
}

export function createVulnerability(name: string, aliases?: string[]): Vulnerability {
  const vuln: Vulnerability = { name };
  if (aliases && aliases.length > 0) {
    vuln.aliases = aliases;
  }
  return vuln;
}

/**
 * Create a component from ProductInput (string or object with subcomponents)
 */
function createComponentFromProductInput(input: ProductInput): Component {
  if (typeof input === "string") {
    return createComponentFromIdentifier(input);
  }

  const component = createComponentFromIdentifier(input.id);
  if (input.subcomponents && input.subcomponents.length > 0) {
    component.subcomponents = input.subcomponents.map(createSubcomponent);
  }
  return component;
}

/**
 * Check if an object is a pre-built Statement by validating against the schema
 */
function isStatement(obj: Statement | CreateStatementOptions): obj is Statement {
  return v.is(statementSchema, obj);
}

/**
 * Create a statement from CreateStatementOptions
 */
function createStatementFromOptions(options: CreateStatementOptions, timestamp: string): Statement {
  if (options.products.length === 0) {
    throw new Error("at least one product is required");
  }

  const products = options.products.map(createComponentFromProductInput);
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
  };

  if (options.supplier !== undefined) {
    baseStatement.supplier = options.supplier;
  }

  if (options.statusNote !== undefined) {
    baseStatement.status_notes = options.statusNote;
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
 * Create a single VEX statement
 * @param options - Statement options
 * @param timestamp - Optional timestamp (auto-generated if not provided)
 */
export function createStatement(options: CreateStatementOptions, timestamp?: string): Statement {
  return createStatementFromOptions(options, timestamp ?? getCurrentTimestamp());
}

/**
 * Create an OpenVEX document with one or more statements
 */
export function createDocument(options: CreateDocumentOptions): OpenVexDocument {
  if (options.statements.length === 0) {
    throw new Error("at least one statement is required");
  }

  const timestamp = getCurrentTimestamp();

  const statements = options.statements.map((stmtOrOptions) => {
    if (isStatement(stmtOrOptions)) {
      return stmtOrOptions;
    }
    return createStatementFromOptions(stmtOrOptions, timestamp);
  });

  const docWithoutId: Omit<OpenVexDocument, "@id"> = {
    "@context": "https://openvex.dev/ns/v0.2.0",
    author: options.author,
    timestamp,
    version: 1,
    statements,
  };

  if (options.role !== undefined) {
    docWithoutId.role = options.role;
  }

  const id = options.id || generateCanonicalId(docWithoutId);

  return {
    ...docWithoutId,
    "@id": id,
  };
}
