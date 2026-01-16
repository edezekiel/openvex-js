/**
 * Parse OpenVEX documents from JSON
 * Following "parse, don't validate" principle
 */

import * as v from "valibot";
import type { OpenVexDocument } from "./schemas.js";
import { openVexDocumentSchema } from "./schemas.js";

/**
 * Parse an OpenVEX document from a JSON string
 * @param input - JSON string to parse
 * @returns Parsed and validated OpenVEX document
 * @throws Error if parsing or validation fails
 */
export function parseOpenVexDocument(input: string): OpenVexDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }

  return parseOpenVexDocumentFromUnknown(parsed);
}

/**
 * Parse an OpenVEX document from an unknown value (e.g., from fetch response)
 * @param input - Unknown value to parse
 * @returns Parsed and validated OpenVEX document
 * @throws Error if validation fails
 */
export function parseOpenVexDocumentFromUnknown(input: unknown): OpenVexDocument {
  try {
    return v.parse(openVexDocumentSchema, input);
  } catch (error) {
    if (error instanceof v.ValiError) {
      const issues = error.issues.map((issue) => {
        const path =
          issue.path
            ?.map((p: { key: string | number }) => (typeof p.key === "string" ? p.key : String(p.key)))
            .join(".") || "root";
        return `${path}: ${issue.message}`;
      });
      throw new Error(`Invalid OpenVEX document: ${issues.join("; ")}`);
    }
    throw new Error(`Failed to parse OpenVEX document: ${error instanceof Error ? error.message : String(error)}`);
  }
}
