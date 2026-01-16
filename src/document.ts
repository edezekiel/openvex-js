import { createHash } from "node:crypto";
import { Temporal } from "@js-temporal/polyfill";
import * as v from "valibot";
import type {
  CreateDocumentOptions,
  CreateStatementOptions,
  ProductInput,
  SubcomponentInput,
} from "./create-options.js";
import type {
  AffectedStatement,
  Component,
  FixedOrUnderInvestigationStatement,
  Hashes,
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
 * Create the base structure for a component/subcomponent from an identifier
 * Only purl, cpe22, and cpe23 are allowed per OpenVEX spec
 * Returns a structure compatible with both Component and Subcomponent
 */
function createComponentBase(identifier: string, hashes?: Hashes): Omit<Component, "subcomponents"> {
  let base: Omit<Component, "subcomponents">;
  if (identifier.startsWith("pkg:")) {
    base = { "@id": identifier };
  } else if (identifier.startsWith("cpe:2.2:")) {
    base = { identifiers: { cpe22: identifier } };
  } else if (identifier.startsWith("cpe:2.3:")) {
    base = { identifiers: { cpe23: identifier } };
  } else {
    throw new Error(
      `Invalid identifier type: "${identifier}". Only purl (pkg:...), cpe22 (cpe:2.2:...), and cpe23 (cpe:2.3:...) are allowed.`,
    );
  }
  if (hashes) {
    base.hashes = hashes;
  }
  return base;
}

/**
 * Create a component from a string identifier
 * Only purl, cpe22, and cpe23 are allowed per OpenVEX spec
 */
function createComponentFromIdentifier(identifier: string, hashes?: Hashes): Component {
  return createComponentBase(identifier, hashes);
}

/**
 * Create a product/component from a string identifier
 * Only purl, cpe22, and cpe23 are allowed per OpenVEX spec
 */
export function createProduct(identifier: string): Component {
  return createComponentFromIdentifier(identifier);
}

/**
 * Create a subcomponent from a string identifier or SubcomponentInput
 * Only purl, cpe22, and cpe23 are allowed per OpenVEX spec
 */
export function createSubcomponent(input: SubcomponentInput): Subcomponent {
  if (typeof input === "string") {
    return createComponentBase(input);
  }
  return createComponentBase(input.id, input.hashes);
}

export function createVulnerability(name: string, aliases?: string[]): Vulnerability {
  const vuln: Vulnerability = { name };
  if (aliases && aliases.length > 0) {
    vuln.aliases = aliases;
  }
  return vuln;
}

/**
 * Create a component from ProductInput (string or object with subcomponents and/or hashes)
 */
function createComponentFromProductInput(input: ProductInput): Component {
  if (typeof input === "string") {
    return createComponentFromIdentifier(input);
  }

  const component = createComponentFromIdentifier(input.id, input.hashes);
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
