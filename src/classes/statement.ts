import { Temporal } from "@js-temporal/polyfill";
import type { Justification, Statement, StatementStatus } from "../schemas.js";
import { statementSchema } from "../schemas.js";
import { ComponentBuilder, type SubcomponentInput } from "./component.js";
import { VulnerabilityBuilder } from "./vulnerability.js";

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

export class StatementBuilder {
  readonly #data: Readonly<Statement>;

  private constructor(data: Statement) {
    this.#data = Object.freeze({ ...data });
  }

  static create(options: CreateStatementOptions): StatementBuilder {
    const timestamp = options.timestamp ?? Temporal.Now.instant().toString();
    return new StatementBuilder(StatementBuilder.buildStatementData(options, timestamp));
  }

  private static buildStatementData(options: CreateStatementOptions, timestamp: string): Statement {
    if (options.products.length === 0) {
      throw new Error("at least one product is required");
    }

    const products = options.products.map((p) => ComponentBuilder.create(p).toData());

    const vulnerability = VulnerabilityBuilder.create({
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
      const firstIssue = result.error.issues[0];
      throw new Error(firstIssue?.message ?? "Invalid statement");
    }

    return result.data;
  }

  toData(): Statement {
    return structuredClone(this.#data);
  }
}
