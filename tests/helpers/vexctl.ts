/**
 * Helper functions for executing vexctl and comparing outputs
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { CreateDocumentOptions } from "../../src/create-options.js";

export type VexCtlCreateOptions = CreateDocumentOptions;

/**
 * Execute `vexctl create` with the given options and return the JSON output
 *
 * vexctl accepts positional arguments: [product_id [vuln_id [status]]]
 * For multiple products, use --product flags
 */
export function runVexCtlCreate(options: VexCtlCreateOptions): unknown {
  const args: string[] = [];

  // Handle positional arguments: product, vulnerability, status
  // If single product, use positional arg; if multiple, use --product flags
  if (options.products && options.products.length > 1) {
    // Multiple products: use --product flags
    for (const product of options.products) {
      args.push("--product", product);
    }
    // Vulnerability and status must be flags when using multiple products
    if (options.vulnerability) {
      args.push("--vuln", options.vulnerability);
    }
    if (options.status) {
      args.push("--status", options.status);
    }
  } else {
    // Single product: use positional arguments
    const product = options.product || options.products?.[0];
    if (product) {
      args.push(product);
    }
    if (options.vulnerability) {
      args.push(options.vulnerability);
    }
    if (options.status) {
      args.push(options.status);
    }
  }

  // Add author
  if (options.author) {
    args.push("--author", options.author);
  }

  // Add role
  if (options.role) {
    args.push("--author-role", options.role);
  }

  // Add justification
  if (options.justification) {
    args.push("--justification", options.justification);
  }

  // Add action statement
  if (options.actionStatement) {
    args.push("--action-statement", options.actionStatement);
  }

  // Add impact statement
  if (options.impactStatement) {
    args.push("--impact-statement", options.impactStatement);
  }

  // Add status note
  if (options.statusNote) {
    args.push("--status-note", options.statusNote);
  }

  // Add subcomponents
  if (options.subcomponents) {
    for (const subcomponent of options.subcomponents) {
      args.push("--subcomponents", subcomponent);
    }
  }

  // Add aliases
  if (options.aliases) {
    for (const alias of options.aliases) {
      args.push("--aliases", alias);
    }
  }

  // Add document ID
  if (options.id) {
    args.push("--id", options.id);
  }

  // Always use local binary to ensure consistent version across all hosts
  const localVexCtl = join(process.cwd(), ".bin", "vexctl");

  if (!existsSync(localVexCtl)) {
    throw new Error(`vexctl binary not found at ${localVexCtl}. Please run 'npm install' to install it.`);
  }

  try {
    // Use spawnSync to properly handle arguments with special characters
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

/**
 * Normalize a document by removing or normalizing dynamic fields
 * This allows comparison of documents that may have different IDs or timestamps
 */
export function normalizeDocument(doc: unknown): unknown {
  if (typeof doc !== "object" || doc === null) {
    return doc;
  }

  const normalized = { ...doc } as Record<string, unknown>;

  // Remove or normalize @id (it's generated)
  if ("@id" in normalized) {
    normalized["@id"] = "<generated>";
  }

  // Normalize timestamps to a placeholder
  if ("timestamp" in normalized && typeof normalized["timestamp"] === "string") {
    normalized["timestamp"] = "<timestamp>";
  }

  if ("last_updated" in normalized && typeof normalized["last_updated"] === "string") {
    normalized["last_updated"] = "<timestamp>";
  }

  // Normalize statement timestamps
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
