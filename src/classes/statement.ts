import { Temporal } from "@js-temporal/polyfill";
import type {
  AffectedStatement,
  Component as ComponentType,
  FixedOrUnderInvestigationStatement,
  Justification,
  NotAffectedStatement,
  StatementStatus,
  Statement as StatementType,
  Vulnerability as VulnerabilityType,
} from "../schemas.js";
import { statementSchema } from "../schemas.js";
import { Component, type SubcomponentInput } from "./component.js";
import { Vulnerability } from "./vulnerability.js";

export type ProductInput =
  | string
  | {
      id: string;
      subcomponents?: SubcomponentInput[];
      hashes?: Record<string, string>;
    };

export interface CreateStatementOptions {
  vulnerability: string;
  status: StatementStatus;
  products: ProductInput[];
  aliases?: string[];
  justification?: Justification;
  actionStatement?: string;
  impactStatement?: string;
  statusNote?: string;
  supplier?: string;
  timestamp?: string;
}

export class Statement {
  readonly #data: Readonly<StatementType>;

  private constructor(data: StatementType) {
    this.#data = Object.freeze({ ...data });
  }

  static create(options: CreateStatementOptions): Statement {
    const timestamp = options.timestamp ?? Temporal.Now.instant().toString();
    return new Statement(Statement.buildStatementData(options, timestamp));
  }

  static fromData(data: StatementType): Statement {
    return new Statement(statementSchema.parse(structuredClone(data)));
  }

  private static buildStatementData(options: CreateStatementOptions, timestamp: string): StatementType {
    if (options.products.length === 0) {
      throw new Error("at least one product is required");
    }

    const products = options.products.map((p) => Component.create(p).toData());

    const vulnerability = Vulnerability.create({
      name: options.vulnerability,
      aliases: options.aliases,
    }).toData();

    const base: {
      vulnerability: VulnerabilityType;
      products: ComponentType[];
      status: StatementStatus;
      timestamp: string;
      supplier?: string;
      status_notes?: string;
    } = { vulnerability, products, status: options.status, timestamp };

    if (options.supplier) base.supplier = options.supplier;
    if (options.statusNote) base.status_notes = options.statusNote;

    if (options.status === "not_affected") {
      if (!options.justification && !options.impactStatement) {
        throw new Error("not_affected status requires either justification or impactStatement");
      }
      const stmt: NotAffectedStatement = { ...base, status: "not_affected" };
      if (options.justification) stmt.justification = options.justification;
      if (options.impactStatement) stmt.impact_statement = options.impactStatement;
      return stmt;
    }

    if (options.status === "affected") {
      if (!options.actionStatement) {
        throw new Error("affected status requires actionStatement");
      }
      return {
        ...base,
        status: "affected",
        action_statement: options.actionStatement,
        action_statement_timestamp: timestamp,
      } satisfies AffectedStatement;
    }

    return { ...base, status: options.status } satisfies FixedOrUnderInvestigationStatement;
  }

  toData(): StatementType {
    return structuredClone(this.#data);
  }
}
