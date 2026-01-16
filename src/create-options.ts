/**
 * Options for creating OpenVEX documents
 * Compatible with vexctl create command options
 */

import type { Justification, StatementStatus } from "./types.js";

export interface CreateDocumentOptions {
  product?: string;
  products?: string[];
  vulnerability?: string;
  status?: StatementStatus;
  author?: string;
  role?: string;
  justification?: Justification;
  actionStatement?: string;
  impactStatement?: string;
  statusNote?: string;
  subcomponents?: string[];
  aliases?: string[];
  id?: string;
}
