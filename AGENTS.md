# Repository Guidelines

## Quick Context

OpenVEX is a TypeScript library implementing the OpenVEX specification for creating, validating, and working with VEX (Vulnerability Exploitability eXchange) documents. It provides type-safe interfaces and runtime validation using Valibot.

---

## AI Behavior Rules

### Essential Rules

1. **Read before editing** - Always read relevant files before proposing changes
2. **Don't over-engineer** - Only make changes directly requested
3. **No speculative features** - Don't add features, refactoring, or "improvements" beyond what's asked
4. **Minimal complexity** - Use existing patterns; don't create abstractions for one-time operations
5. **Fix your errors** - If you introduce linter errors, fix them
6. **Run validation** - Always run `npm run biome:fix && npm run typecheck && npm run test` after changes

### Code Patterns

1. **TypeScript everywhere** - No `any` types without justification
2. **Explicit interfaces** - Prefer interfaces in `src/types.ts` or colocated `types.ts` files
3. **Biome defaults** - 2-space indentation, double quotes, trailing commas
4. **Valibot for validation** - Use Valibot schemas for runtime validation alongside TypeScript types
5. **Build-free dev** - Development workflow uses TypeScript directly (no build step); tsdown only for distribution builds
6. **No JS Date object** - Never use `new Date()` or the `Date` object; use `@js-temporal/polyfill` with `Temporal.Now.instant().toString()` for timestamps

### Testing

1. **Unit tests for pure functions** - Test inputs/outputs without collaborators
2. **Tests in tests/ directory** - Place all test files in `tests/` directory (not beside code)
3. **Test naming** - Use `*.test.ts` or `*.spec.ts` naming convention
4. **Test real examples** - Use real OpenVEX examples from spec/vexctl repos when possible

### Commits

1. **Conventional commits** - Use `feat:`, `fix:`, `chore:`, etc.
2. **Scoped prefixes** - Use `feat(types):`, `fix(validation):`, `chore(build):` etc.
3. **Imperative mood** - "add feature" not "added feature"

---

## Project Conventions

### Directory Structure

```bash
openvex/
├── src/
│   ├── index.ts              # Main entry point (exports everything)
│   ├── types.ts              # TypeScript type definitions
│   ├── schemas.ts            # Valibot validation schemas
│   ├── document.ts           # Document class/utilities
│   ├── statement.ts          # Statement class/utilities
│   ├── product.ts            # Product/Component types and utilities
│   ├── vulnerability.ts      # Vulnerability types and utilities
│   └── validation.ts         # Validation utilities
├── tests/                    # All test files
│   └── ...
├── docs/                     # Documentation
├── package.json
├── tsconfig.json             # TypeScript config (noEmit for dev)
├── tsdown.config.ts          # Build config for distribution
├── biome.json                # Linting/formatting
└── vitest.config.ts          # Test configuration
```

---

## Essential Commands

| Command | Purpose |
| ------- | ------- |
| `npm run typecheck` | TypeScript type checking (no emit) |
| `npm run test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run biome:fix` | Auto-fix linting and formatting issues |
| `npm run biome` | Check linting and formatting (no fix) |
| `npm run build` | Build distribution files (ESM, CJS, types) |
| `npm run dev` | Watch mode for build (optional) |

---

## Development Workflow

### Build-Free Development

- Write TypeScript directly in `src/` - no build step needed during development
- Run `npm run typecheck` to validate types
- Run `npm run test` to run tests
- Run `npm run biome:fix` before committing

### Building for Distribution

- Run `npm run build` to create `dist/` with ESM, CJS, and type definitions
- Only needed when publishing to npm
- Uses tsdown to generate both module formats and declarations

---

## AI-Specific Instructions

### Over-Eagerness Prevention

- **Don't add features** beyond what's requested
- **Don't refactor** surrounding code when fixing a bug
- **Don't add error handling** for scenarios that can't happen
- **Don't create helpers** for one-time operations
- **Don't design** for hypothetical future requirements

### Tool Usage

- Use `read_file` before proposing edits
- Use `codebase_search` for "how/where/what" questions
- Use `grep` for exact symbol searches
- Prefer editing existing files over creating new ones

---

## Testing Quick Reference

- Favor unit tests for pure functions where inputs and outputs can be asserted without collaborators
- Place all test files in `tests/` directory
- Use real OpenVEX examples from the spec or vexctl repos when testing
- Test both TypeScript types and Valibot schema validation
- Use descriptive test names that explain what is being tested

---

## Coding Style & Naming Conventions

- Target Node 24+ ES modules, TypeScript strictness, and Biome defaults
- Name files with kebab-case for scripts and PascalCase for exported TypeScript classes
- Use descriptive directory names for bounded contexts
- Prefer explicit interfaces; avoid `any`
- Keep Valibot schemas in sync with TypeScript types

---

## OpenVEX-Specific Guidelines

### Type Definitions

- Match the official OpenVEX JSON schema structure
- Support all status values: `not_affected`, `affected`, `fixed`, `under_investigation`
- Handle multiple identifier types (purl, cpe22, cpe23)
- Support inheritance flow (document timestamp cascading to statements)

### Validation

- Use Valibot schemas for runtime validation
- Validate against the official OpenVEX JSON schema structure
- Provide clear error messages for validation failures
- Leverage Valibot's modular design for tree-shaking and smaller bundle size

---
