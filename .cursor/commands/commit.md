# /commit — Generate a Semantic Commit Message

## Goal

Generate a **clear, descriptive, semantic commit message** using the correct **type** and **area**, based strictly on the **current staged diff** and recent work context.

This command does **not** guess.  
It inspects what actually changed and names it precisely.

---

## Required Commit Format

All commits must follow this structure:

```txt
<type>(<area>): <concise present-tense summary>
```

Optional extended body:

```txt
<type>(<area>): <summary>

- Bullet point describing meaningful change
- Bullet point describing meaningful change
- Note about behavior change, migration, or risk (if applicable)
```

**Line Length Rules:**

- **Summary line**: Maximum 50 characters
- **Body lines**: Maximum 72 characters per line
- **No capitalized letters**: Use lowercase throughout (except for proper nouns if absolutely necessary)

---

## ✅ Allowed Commit Types

You must use **exactly one** of:

- `feat`
- `fix`
- `test`
- `refactor`
- `chore`
- `docs`
- `perf`
- `ci`

---

## ✅ Area Must Be Present

The `<area>` is **required** and must map to a real system boundary in the OpenVEX library.

### Common Areas by Domain

**Core Types & Validation:**

- `types` - TypeScript type definitions
- `schemas` - Zod validation schemas
- `validation` - Validation utilities and error handling

**OpenVEX Components:**

- `document` - VEX document creation, parsing, serialization
- `statement` - VEX statement handling
- `product` - Product/Component types and utilities
- `vulnerability` - Vulnerability types and utilities

**Infrastructure:**

- `build` - Build configuration (tsdown, package.json)
- `config` - Configuration files (tsconfig, biome, vitest)
- `shared` - Shared utilities and helpers

**Testing:**

- `test` - Unit and integration tests

**Other:**

- `docs` - Documentation
- `deps` - Dependency updates
- `ci` - CI/CD pipelines

### How to Determine Area

Map file paths to areas:

- `src/types.ts` → `types`
- `src/schemas.ts` → `schemas`
- `src/validation.ts` → `validation`
- `src/document.ts` → `document`
- `src/statement.ts` → `statement`
- `src/product.ts` → `product`
- `src/vulnerability.ts` → `vulnerability`
- `src/index.ts` → `document` (or primary export area)
- `tests/**` → `test`
- `tsdown.config.ts`, `package.json` → `build`
- `tsconfig.json`, `biome.json`, `vitest.config.ts` → `config`
- `.github/workflows/**` → `ci`
- `docs/**` → `docs`

If multiple areas were touched:

- Choose the **primary driver of the change**
- Do **not** combine multiple areas

---

## ✅ Summary Line Rules

The summary must:

- Be written in **present tense**
- Start with a **verb**
- Describe **what changed**, not how
- Be **specific**
- Never include implementation details
- **Maximum 50 characters** (including the `<type>(<area>):` prefix)
- **Use lowercase** - no capitalized letters (except proper nouns if absolutely necessary)

---

## What This Command Must Inspect

Before generating a commit message, inspect:

1. ✅ **Staged files only** (use `git diff --cached`)
2. ✅ **File paths** to infer the **area** (see mapping above)
3. ✅ **Change type** by examining:
   - Whether it adds new user-facing behavior → `feat`
   - Whether it fixes broken behavior → `fix`
   - Whether it's test code only → `test`
   - Whether it restructures without behavior change → `refactor`
   - Whether it's tooling/config/deps → `chore`
   - Whether it's documentation only → `docs`
   - Whether it improves performance → `perf`
   - Whether it touches CI → `ci`

4. ✅ **Project context**:
   - This is a **TypeScript library** implementing OpenVEX
   - Main components: document, statement, product, vulnerability
   - Uses Zod for runtime validation
   - Uses Vitest for testing
   - Build-free dev workflow with tsdown for distribution

Do **not** include:

- Unstaged changes
- Hypothetical future work
- TODOs not implemented

---

## Example Outputs

### ✅ Simple Feature

```txt
feat(document): add json document creation
```

### ✅ Bug Fix with Body

```txt
fix(validation): handle missing required fields

- check for null products before validation
- return clear error messages for missing
  fields
```

### ✅ Test Addition

```txt
test(document): add parsing edge case coverage
```

### ✅ Type Definition

```txt
feat(types): add openvex status enum types
```

### ✅ Schema Addition

```txt
feat(schemas): add zod vulnerability schema
```

### ✅ Refactor

```txt
refactor(product): extract identifier parsing
```

### ✅ Configuration

```txt
chore(config): update biome schema version
```

---

## Hard Rules

- Never generate vague commits
- Never omit the area
- Never use past tense
- Never describe implementation details in the summary
- The summary must match the actual diff
- **Summary line must be ≤ 50 characters** (including type and area)
- **Body lines must be ≤ 72 characters** per line
- **Use lowercase** throughout the commit message (no capitalized letters)

---

## Execute Now

Generate the correct **semantic commit message** based on the current staged changes.
