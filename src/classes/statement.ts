import { Temporal } from "@js-temporal/polyfill";
import type { Justification, StatementStatus, Statement as StatementType } from "../schemas.js";
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

  private static buildStatementData(options: CreateStatementOptions, timestamp: string): StatementType {
    if (options.products.length === 0) {
      throw new Error("at least one product is required");
    }

    const products = options.products.map((p) => Component.create(p).toData());

    const vulnerability = Vulnerability.create({
      name: options.vulnerability,
      aliases: options.aliases,
    }).toData();

    const statementData: unknown = {
      vulnerability,
      products,
      status: options.status,
      timestamp,
      ...(options.supplier && { supplier: options.supplier }),
      ...(options.statusNote && { status_notes: options.statusNote }),
      ...(options.justification && { justification: options.justification }),
      ...(options.impactStatement && { impact_statement: options.impactStatement }),
      ...(options.actionStatement && {
        action_statement: options.actionStatement,
        action_statement_timestamp: timestamp,
      }),
    };

    const result = statementSchema.safeParse(statementData);
    if (!result.success) {
      const issues = result.error.issues;
      for (const issue of issues) {
        if (issue.message.includes("justification or impact_statement")) {
          throw new Error("not_affected status requires either justification or impactStatement");
        }
        if (issue.message.includes("action_statement")) {
          throw new Error("affected status requires actionStatement");
        }
      }
      throw new Error(issues[0]?.message ?? "Invalid statement");
    }

    return result.data;
  }

  toData(): StatementType {
    return structuredClone(this.#data);
  }
}
