import { createHash } from "node:crypto";
import { Temporal } from "@js-temporal/polyfill";
import { OpenVexValidationError } from "../errors.js";
import type { OpenVexDocument as OpenVexDocumentType, Statement as StatementType } from "../schemas.js";
import { openVexDocumentSchema } from "../schemas.js";
import { type CreateStatementOptions, Statement } from "./statement.js";

export interface CreateDocumentOptions {
  author?: string;
  role?: string;
  id?: string;
  statements: CreateStatementOptions[];
}

export type { SubcomponentInput } from "./component.js";
export type { CreateStatementOptions, ProductInput } from "./statement.js";

export class OpenVexDocument {
  readonly #data: Readonly<OpenVexDocumentType>;

  private constructor(data: OpenVexDocumentType) {
    this.#data = Object.freeze({ ...data });
  }

  static create(options: CreateDocumentOptions): OpenVexDocument {
    if (options.statements.length === 0) {
      throw new Error("at least one statement is required");
    }

    const timestamp = Temporal.Now.instant().toString();
    const statements: StatementType[] = options.statements.map((s) => Statement.create({ ...s, timestamp }).toData());

    const docWithoutId: Omit<OpenVexDocumentType, "@id"> = {
      "@context": "https://openvex.dev/ns/v0.2.0",
      author: options.author ?? "Unknown Author",
      timestamp,
      version: 1,
      statements,
      ...(options.role && { role: options.role }),
    };

    const id = options.id || OpenVexDocument.buildCanonicalId(docWithoutId);
    return new OpenVexDocument({ ...docWithoutId, "@id": id });
  }

  private static buildCanonicalId(doc: Omit<OpenVexDocumentType, "@id">): string {
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

  static parse(input: unknown): OpenVexDocument {
    const result = openVexDocumentSchema.safeParse(input);
    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        path: issue.path.length > 0 ? issue.path.join(".") : "root",
        message: issue.message,
      }));
      throw new OpenVexValidationError(
        `Invalid OpenVEX document: ${issues.map((i) => `${i.path}: ${i.message}`).join("; ")}`,
        issues,
      );
    }
    return new OpenVexDocument(result.data);
  }

  toJSON(): string {
    return JSON.stringify(this.#data, null, 2);
  }

  toData(): OpenVexDocumentType {
    return structuredClone(this.#data);
  }
}
