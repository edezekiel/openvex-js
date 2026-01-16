import * as v from "valibot";
import { OpenVexValidationError } from "./errors.js";
import type { OpenVexDocument } from "./schemas.js";
import { openVexDocumentSchema } from "./schemas.js";

/**
 * Parse an OpenVEX document from a JSON string
 * @param input - JSON string to parse
 * @returns Parsed and validated OpenVEX document
 * @throws OpenVexValidationError if parsing or validation fails
 */
export function parseOpenVexDocument(input: string): OpenVexDocument {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (error) {
    throw new OpenVexValidationError(`Invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }

  return parseOpenVexDocumentFromUnknown(parsed);
}

/**
 * Parse an OpenVEX document from an unknown value (e.g., from fetch response)
 * @param input - Unknown value to parse
 * @returns Parsed and validated OpenVEX document
 * @throws OpenVexValidationError if validation fails
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
        return { path, message: issue.message };
      });
      throw new OpenVexValidationError(
        `Invalid OpenVEX document: ${issues.map((i) => `${i.path}: ${i.message}`).join("; ")}`,
        issues,
      );
    }
    throw new OpenVexValidationError(
      `Failed to parse OpenVEX document: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
