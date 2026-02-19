# AGENTS.md

This file provides guidance to AI coding assistants working with code in this repository.

## Commands

- `pnpm test` — run all tests (vitest)
- `pnpm vitest run tests/create.test.ts` — run a single test file
- `pnpm vitest run -t "description"` — run tests matching a pattern
- `pnpm run typecheck` — TypeScript type checking (tsc --noEmit)
- `pnpm run biome` — lint/format check (Biome)
- `pnpm run biome:fix` — auto-fix lint/format issues
- `pnpm run build` — build with tsdown (outputs ESM + DTS to dist/)

## Architecture

### Immutable Classes (`src/classes/`)

All domain objects are immutable with `static create()` factories and `toJSON()` for plain data. Classes use `deepFreeze()` internally and return `structuredClone()` from `toJSON()` to prevent mutation.

### Zod Schemas (`src/schemas.ts`)

The statement schema is a union on `status` field, with each variant enforcing which fields are allowed/required. `StatementData` and `OpenVexDocumentData` types are manually defined (not `z.infer<>`) to work around DTS serialization limits (TS7056) caused by complex passthrough schemas.

### Error Handling (`src/errors.ts`)

All validation failures throw `OpenVexValidationError` with an `issues` array. The `throwValidationError()` helper converts `z.SafeParseError` to `OpenVexValidationError` surfacing all Zod issues.

### Test Structure (`tests/`)

Integration tests compare library output against the reference `vexctl` CLI. Test fixtures in `tests/fixtures/` are JSON files containing both `vexctl` CLI options and `library` options. The `normalizeDocument` helper strips non-deterministic fields (timestamps, IDs) before comparison.

Fixture categories: `validVexctlFixtureTests` (compared against vexctl output) and `errorVexctlFixtureTests` (both library and vexctl should error). Library-only fixtures test features beyond vexctl's capabilities.

## Conventions

- **pnpm** for package management (not npm)
- Biome for linting/formatting: double quotes, 2-space indent, 120 char line width
- `noConsole` rule enabled (library code should not use console; `scripts/` is exempt)
- `verbatimModuleSyntax` is enabled — use `import type` for type-only imports
- `.js` extensions in import paths (required by NodeNext module resolution)
- Never use `new Date()` — use `Temporal.Now.instant().toString()` from `@js-temporal/polyfill`
- Changesets for versioning/changelog — run `pnpm changeset` to describe changes before merging
