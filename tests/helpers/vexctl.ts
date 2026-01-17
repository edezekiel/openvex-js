import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { CreateDocumentOptions, ProductInput } from "../../src/classes/document.js";
import type { Justification, StatementStatus } from "../../src/schemas.js";

export interface VexCtlOptions {
  product?: string;
  products?: string[];
  vulnerability: string;
  status: StatementStatus;
  author: string;
  role?: string;
  id?: string;
  subcomponents?: string[];
  aliases?: string[];
  justification?: Justification;
  actionStatement?: string;
  impactStatement?: string;
  statusNote?: string;
  supplier?: string;
}

export function vexctlOptionsToCreateDocumentOptions(options: VexCtlOptions): CreateDocumentOptions {
  let productInputs: ProductInput[];

  if (options.products && options.products.length > 0) {
    productInputs = options.products;
  } else if (options.product) {
    productInputs = [options.product];
  } else {
    productInputs = [];
  }

  if (options.subcomponents && options.subcomponents.length > 0 && productInputs.length === 1) {
    const productId = productInputs[0];
    if (typeof productId === "string") {
      productInputs = [{ id: productId, subcomponents: options.subcomponents }];
    }
  }

  return {
    author: options.author,
    role: options.role,
    id: options.id,
    statements: [
      {
        vulnerability: options.vulnerability,
        status: options.status,
        products: productInputs,
        aliases: options.aliases,
        justification: options.justification,
        actionStatement: options.actionStatement,
        impactStatement: options.impactStatement,
        statusNote: options.statusNote,
        supplier: options.supplier,
      },
    ],
  };
}

export function runVexCtlCreate(options: VexCtlOptions): unknown {
  const args: string[] = [];

  const products = options.products ?? (options.product ? [options.product] : []);

  if (products.length > 1) {
    for (const product of products) {
      args.push("--product", product);
    }
    args.push("--vuln", options.vulnerability);
    args.push("--status", options.status);
  } else {
    const product = products[0];
    if (product) {
      args.push(product);
    }
    args.push(options.vulnerability);
    args.push(options.status);
  }

  args.push("--author", options.author);
  if (options.role) args.push("--author-role", options.role);
  if (options.justification) args.push("--justification", options.justification);
  if (options.actionStatement) args.push("--action-statement", options.actionStatement);
  if (options.impactStatement) args.push("--impact-statement", options.impactStatement);
  if (options.statusNote) args.push("--status-note", options.statusNote);
  if (options.subcomponents) {
    for (const subcomponent of options.subcomponents) {
      args.push("--subcomponents", subcomponent);
    }
  }
  if (options.aliases) {
    for (const alias of options.aliases) {
      args.push("--aliases", alias);
    }
  }
  if (options.id) args.push("--id", options.id);

  const localVexCtl = join(process.cwd(), ".bin", "vexctl");

  if (!existsSync(localVexCtl)) {
    throw new Error(`vexctl binary not found at ${localVexCtl}. Please run 'npm run install-vexctl' to install it.`);
  }

  try {
    const result = spawnSync(localVexCtl, ["create", ...args], {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (result.error) {
      throw result.error;
    }

    if (result.status !== 0) {
      throw new Error(
        `vexctl create failed with status ${result.status}: ${result.stderr || result.stdout || "Unknown error"}`,
      );
    }

    const output = result.stdout;
    if (!output) {
      throw new Error("vexctl create produced no output");
    }

    return JSON.parse(output);
  } catch (error) {
    throw new Error(`vexctl create failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function normalizeDocument(doc: unknown): unknown {
  if (typeof doc !== "object" || doc === null) {
    return doc;
  }

  const normalized = { ...doc } as Record<string, unknown>;

  if ("@id" in normalized) normalized["@id"] = "<generated>";
  if ("timestamp" in normalized && typeof normalized["timestamp"] === "string") {
    normalized["timestamp"] = "<timestamp>";
  }
  if ("last_updated" in normalized && typeof normalized["last_updated"] === "string") {
    normalized["last_updated"] = "<timestamp>";
  }

  if ("statements" in normalized && Array.isArray(normalized["statements"])) {
    normalized["statements"] = (normalized["statements"] as unknown[]).map((stmt: unknown) => {
      if (typeof stmt === "object" && stmt !== null) {
        const stmtObj = { ...stmt } as Record<string, unknown>;
        if ("timestamp" in stmtObj && typeof stmtObj["timestamp"] === "string") {
          stmtObj["timestamp"] = "<timestamp>";
        }
        if ("action_statement_timestamp" in stmtObj && typeof stmtObj["action_statement_timestamp"] === "string") {
          stmtObj["action_statement_timestamp"] = "<timestamp>";
        }
        if ("last_updated" in stmtObj && typeof stmtObj["last_updated"] === "string") {
          stmtObj["last_updated"] = "<timestamp>";
        }
        return stmtObj;
      }
      return stmt;
    });
  }

  return normalized;
}
