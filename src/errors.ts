import type { z } from "zod";

export interface ValidationIssue {
  path: string;
  message: string;
}

export class OpenVexValidationError extends Error {
  public readonly issues?: ValidationIssue[];

  constructor(message: string, issues?: ValidationIssue[]) {
    super(message);
    this.name = "OpenVexValidationError";
    this.issues = issues;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, OpenVexValidationError);
    }
  }
}

export function throwValidationError(result: z.SafeParseError<unknown>): never {
  const issues: ValidationIssue[] = result.error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join(".") : "root",
    message: issue.message,
  }));
  throw new OpenVexValidationError(
    `Validation failed: ${issues.map((i) => `${i.path}: ${i.message}`).join("; ")}`,
    issues,
  );
}
