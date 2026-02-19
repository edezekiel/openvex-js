import { createHash } from "node:crypto";
import { Temporal } from "@js-temporal/polyfill";
import { OpenVexValidationError, throwValidationError, type ValidationIssue } from "../errors.js";
import type { OpenVexDocumentData, StatementData, StatementStatus } from "../schemas.js";
import { openVexDocumentSchema } from "../schemas.js";
import { deepFreeze } from "../utils.js";
import { type CreateStatementOptions, Statement } from "./statement.js";

export interface CreateDocumentOptions {
  author?: string;
  role?: string;
  id?: string;
  tooling?: string;
  statements: CreateStatementOptions[];
}

type OpenVexDocumentWithoutId = Pick<
  OpenVexDocumentData,
  "@context" | "author" | "timestamp" | "version" | "statements" | "role" | "last_updated" | "tooling"
>;

export type { SubcomponentInput } from "./component.js";
export type { CreateStatementOptions, ProductInput, VulnerabilityInput } from "./statement.js";

export class Document {
  readonly #data: Readonly<OpenVexDocumentData>;

  private constructor(data: OpenVexDocumentData) {
    this.#data = deepFreeze({ ...data });
  }

  static create(options: CreateDocumentOptions): Document {
    if (options.statements.length === 0) {
      throw new OpenVexValidationError("at least one statement is required");
    }

    const timestamp = Temporal.Now.instant().toString();
    const statements: StatementData[] = options.statements.map((s) => Statement.create({ ...s, timestamp }).toJSON());

    const docWithoutId: OpenVexDocumentWithoutId = {
      "@context": "https://openvex.dev/ns/v0.2.0",
      author: options.author ?? "Unknown Author",
      timestamp,
      version: 1,
      statements,
      ...(options.role && { role: options.role }),
      ...(options.tooling && { tooling: options.tooling }),
    };

    const id = options.id || Document.buildCanonicalId(docWithoutId);
    const document: OpenVexDocumentData = { ...docWithoutId, "@id": id };
    return new Document(document);
  }

  private static buildCanonicalId(doc: OpenVexDocumentWithoutId): string {
    const { timestamp: _timestamp, last_updated: _last_updated, ...rest } = doc;
    const hash = createHash("sha256")
      .update(
        JSON.stringify(rest, (_, value) => {
          if (value && typeof value === "object" && !Array.isArray(value)) {
            return Object.keys(value)
              .sort()
              .reduce<Record<string, unknown>>((sorted, k) => {
                sorted[k] = value[k];
                return sorted;
              }, {});
          }
          return value;
        }),
      )
      .digest("hex");
    return `https://openvex.dev/docs/public/vex-${hash}`;
  }

  static parse(input: unknown): Document {
    const result = openVexDocumentSchema.safeParse(input);
    if (!result.success) {
      throwValidationError(result);
    }
    return new Document(result.data);
  }

  static fromJSON(json: string): Document {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new OpenVexValidationError("Invalid JSON string");
    }
    return Document.parse(parsed);
  }

  static validate(input: unknown): ValidationIssue[] {
    const result = openVexDocumentSchema.safeParse(input);
    if (result.success) {
      return [];
    }
    return result.error.issues.map((issue) => ({
      path: issue.path.length > 0 ? issue.path.join(".") : "root",
      message: issue.message,
    }));
  }

  static merge(docs: Document[], options?: { author?: string; id?: string }): Document {
    if (docs.length === 0) {
      throw new OpenVexValidationError("at least one document is required for merge");
    }

    const allStatements: StatementData[] = docs.flatMap((doc) => doc.#data.statements);

    if (allStatements.length === 0) {
      throw new OpenVexValidationError("merged documents must contain at least one statement");
    }

    const timestamp = Temporal.Now.instant().toString();
    const docWithoutId: OpenVexDocumentWithoutId = {
      "@context": "https://openvex.dev/ns/v0.2.0",
      // biome-ignore lint/style/noNonNullAssertion: length check above guarantees docs[0] exists
      author: options?.author ?? docs[0]!.#data.author,
      timestamp,
      version: 1,
      statements: allStatements,
    };

    const id = options?.id || Document.buildCanonicalId(docWithoutId);
    const document: OpenVexDocumentData = { ...docWithoutId, "@id": id };
    return new Document(document);
  }

  addStatement(options: CreateStatementOptions): Document {
    const timestamp = Temporal.Now.instant().toString();
    const newStatement = Statement.create({ ...options, timestamp }).toJSON();

    const newVersion = this.#data.version + 1;
    const docWithoutId: OpenVexDocumentWithoutId = {
      "@context": this.#data["@context"],
      author: this.#data.author,
      timestamp: this.#data.timestamp,
      last_updated: timestamp,
      version: newVersion,
      statements: [...this.#data.statements, newStatement],
      ...(this.#data.role && { role: this.#data.role }),
      ...(this.#data.tooling && { tooling: this.#data.tooling }),
    };

    const id = Document.buildCanonicalId(docWithoutId);
    const document: OpenVexDocumentData = { ...docWithoutId, "@id": id };
    return new Document(document);
  }

  getStatements(): StatementData[] {
    return structuredClone(this.#data.statements) as StatementData[];
  }

  getStatementsByVulnerability(name: string): StatementData[] {
    return this.getStatements().filter((s) => s.vulnerability.name === name);
  }

  getStatementsByProduct(id: string): StatementData[] {
    return this.getStatements().filter((s) => s.products?.some((p) => p["@id"] === id));
  }

  getStatementsByStatus(status: StatementStatus): StatementData[] {
    return this.getStatements().filter((s) => s.status === status);
  }

  toJSON(): OpenVexDocumentData {
    return structuredClone(this.#data);
  }

  serialize(): string {
    return JSON.stringify(this.#data, null, 2);
  }
}
