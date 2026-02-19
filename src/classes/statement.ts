import { Temporal } from "@js-temporal/polyfill";
import { OpenVexValidationError, throwValidationError } from "../errors.js";
import type { Justification, StatementData, StatementStatus } from "../schemas.js";
import { statementSchema } from "../schemas.js";
import { deepFreeze } from "../utils.js";
import { Component, type SubcomponentInput } from "./component.js";
import { Vulnerability } from "./vulnerability.js";

export type ProductInput =
  | string
  | {
      id: string;
      subcomponents?: SubcomponentInput[];
      hashes?: Record<string, string>;
    };

export type VulnerabilityInput =
  | string
  | {
      name: string;
      id?: string;
      description?: string;
      aliases?: string[];
    };

export interface CreateStatementOptions {
  vulnerability: VulnerabilityInput;
  status: StatementStatus;
  products: ProductInput[];
  id?: string;
  version?: number;
  lastUpdated?: string;
  aliases?: string[];
  justification?: Justification;
  actionStatement?: string;
  impactStatement?: string;
  statusNotes?: string;
  supplier?: string;
  timestamp?: string;
}

export class Statement {
  readonly #data: Readonly<StatementData>;

  private constructor(data: StatementData) {
    this.#data = deepFreeze({ ...data });
  }

  static create(options: CreateStatementOptions): Statement {
    const timestamp = options.timestamp ?? Temporal.Now.instant().toString();
    return new Statement(Statement.buildStatementData(options, timestamp));
  }

  private static buildStatementData(options: CreateStatementOptions, timestamp: string): StatementData {
    if (options.products.length === 0) {
      throw new OpenVexValidationError("at least one product is required");
    }

    const products = options.products.map((p) => Component.create(p).toJSON());

    const vulnerability =
      typeof options.vulnerability === "string"
        ? Vulnerability.create({
            name: options.vulnerability,
            aliases: options.aliases,
          }).toJSON()
        : Vulnerability.create({
            name: options.vulnerability.name,
            id: options.vulnerability.id,
            description: options.vulnerability.description,
            aliases: options.vulnerability.aliases ?? options.aliases,
          }).toJSON();

    const statementData: unknown = {
      vulnerability,
      products,
      status: options.status,
      timestamp,
      ...(options.id && { "@id": options.id }),
      ...(options.version && { version: options.version }),
      ...(options.lastUpdated && { last_updated: options.lastUpdated }),
      ...(options.supplier && { supplier: options.supplier }),
      ...(options.statusNotes && { status_notes: options.statusNotes }),
      ...(options.justification && { justification: options.justification }),
      ...(options.impactStatement && { impact_statement: options.impactStatement }),
      ...(options.actionStatement && {
        action_statement: options.actionStatement,
        action_statement_timestamp: timestamp,
      }),
    };

    const result = statementSchema.safeParse(statementData);
    if (!result.success) {
      throwValidationError(result);
    }

    return result.data;
  }

  toJSON(): StatementData {
    return structuredClone(this.#data);
  }
}
