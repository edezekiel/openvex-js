import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { CreateDocumentOptions } from "../../src/classes/document.js";
import type { VexCtlOptions } from "./vexctl.js";

export function loadFixture(path: string): {
  description: string;
  vexctl?: VexCtlOptions;
  library?: CreateDocumentOptions;
} {
  const fullPath = join(import.meta.dirname, "..", "fixtures", path);
  const content = readFileSync(fullPath, "utf-8");
  return JSON.parse(content) as {
    description: string;
    vexctl?: VexCtlOptions;
    library?: CreateDocumentOptions;
  };
}
