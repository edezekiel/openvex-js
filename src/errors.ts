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
