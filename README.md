# openvex-js

TypeScript implementation of the [OpenVEX specification](https://openvex.dev) (v0.2.0) for creating, validating, and working with VEX (Vulnerability Exploitability eXchange) documents.

VEX documents communicate whether a software product is affected by a known vulnerability. This library provides a type-safe API for creating and consuming OpenVEX documents.

## Installation

```bash
pnpm add openvex-js @js-temporal/polyfill zod
```

Both `@js-temporal/polyfill` and `zod` are required peer dependencies.

## Quick Start

### Create a VEX document

```typescript
import { Document } from "openvex-js";

const doc = Document.create({
  author: "Security Team",
  statements: [
    {
      vulnerability: "CVE-2024-1234",
      status: "fixed",
      products: ["pkg:npm/my-package@2.0.0"],
    },
  ],
});

// Get plain data object
const data = doc.toJSON();

// Get JSON string
const json = doc.serialize();
```

### Parse and validate

```typescript
import { Document } from "openvex-js";

// Parse from object
const doc = Document.parse(unknownInput);

// Parse from JSON string
const doc2 = Document.fromJSON('{"@context": "https://openvex.dev/ns/v0.2.0", ...}');

// Validate without throwing (returns issues array, empty = valid)
const issues = Document.validate(unknownInput);
```

### Add statements to an existing document

```typescript
const updated = doc.addStatement({
  vulnerability: "CVE-2024-5678",
  status: "not_affected",
  products: ["pkg:npm/my-package@2.0.0"],
  justification: "vulnerable_code_not_present",
});
// Returns a new immutable Document with incremented version
```

### Merge documents

```typescript
const merged = Document.merge([doc1, doc2], {
  author: "Security Team",
});
```

### Query statements

```typescript
const allStatements = doc.getStatements();
const fixed = doc.getStatementsByStatus("fixed");
const byCve = doc.getStatementsByVulnerability("CVE-2024-1234");
const byProduct = doc.getStatementsByProduct("pkg:npm/my-package@2.0.0");
```

### Rich vulnerability input

```typescript
const doc = Document.create({
  author: "Security Team",
  statements: [
    {
      vulnerability: {
        name: "CVE-2024-1234",
        description: "Buffer overflow in parser",
        aliases: ["GHSA-xxxx-yyyy"],
      },
      status: "affected",
      products: ["pkg:npm/my-package@1.0.0"],
      actionStatement: "Upgrade to version 2.0.0",
    },
  ],
});
```

## API Overview

### Classes

- **`Document`** — Top-level VEX document. Use `Document.create()` to build, `Document.parse()` to validate unknown input.
- **`Statement`** — Individual vulnerability statement with status-specific validation.
- **`Component`** — Product/subcomponent from purl, CPE, or object input.
- **`Vulnerability`** — Vulnerability with name, description, and aliases.

### Serialization

- `toJSON()` — Returns a plain data object (works with `JSON.stringify`)
- `serialize()` — Returns a formatted JSON string (Document only)

### Exported Types

- `OpenVexDocumentData`, `StatementData`, `ComponentData`, `VulnerabilityData`, `SubcomponentData` — Plain data types inferred from Zod schemas
- `CreateDocumentOptions`, `CreateStatementOptions`, `CreateVulnerabilityOptions` — Options for builder methods
- `StatementStatus`, `Justification`, `Hashes`, `HashAlgorithm`, `Identifiers` — Schema enum/utility types

### Zod Schemas

For advanced use cases, Zod schemas can be imported directly from the schemas module:

```typescript
import { openVexDocumentSchema, statementSchema } from "openvex-js/schemas";
```

## Development

### Prerequisites

- Node.js >= 23.6.0 (for development — enables TypeScript type stripping without flags)
- pnpm

### Setup

```bash
pnpm install
pnpm install-vexctl
```

### Scripts

```bash
pnpm test              # Run all tests
pnpm test:watch    # Watch mode
pnpm test:coverage # With coverage
pnpm typecheck     # TypeScript type checking
pnpm biome         # Lint/format check
pnpm biome:fix     # Auto-fix lint/format issues
pnpm build         # Build ESM to dist/
```

### Integration Tests

The test suite compares library output against the reference [`vexctl`](https://github.com/openvex/vexctl) CLI. Run `pnpm install-vexctl` to download the binary (stored in `.bin/`, gitignored).

## License

MIT
