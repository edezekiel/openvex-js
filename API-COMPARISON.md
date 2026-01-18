# API Comparison: go-vex vs openvex-js

This document compares the public APIs of `go-vex` and `openvex-js` to identify alignment opportunities.

## Current State

### go-vex API (Go)

**Document Creation:**
```go
doc := vex.New()
doc.Author = "Wolfi J. Inkinson"
doc.AuthorRole = "Senior VEXing Engineer"

doc.Statements = append(doc.Statements, vex.Statement{
    Vulnerability: vex.Vulnerability{
        ID:          "https://nvd.nist.gov/vuln/detail/CVE-2021-44228",
        Name:        "CVE-2021-44228",
        Description: "Remote code injection in Log4j",
        Aliases: []vex.VulnerabilityID{
            vex.VulnerabilityID("GHSA-jfh8-c2jp-5v3q"),
        },
    },
    Products: []vex.Product{
        {
            Component: vex.Component{
                ID: "pkg:maven/org.springframework.boot/spring-boot@2.6.0-M3",
                Identifiers: map[vex.IdentifierType]string{
                    vex.PURL: "pkg:maven/org.springframework.boot/spring-boot@2.6.0-M3",
                },
                Hashes: map[vex.Algorithm]vex.Hash{
                    vex.SHA256: vex.Hash("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"),
                },
            },
            Subcomponents: []vex.Subcomponent{
                {
                    Component: vex.Component{
                        ID: "pkg:apk/wolfi/bash@1.0.0",
                    },
                },
            },
        },
    },
    Status:        vex.StatusNotAffected,
    Justification: vex.VulnerableCodeNotInExecutePath,
    ImpactStatement: "Spring Boot users are only affected...",
})

doc.GenerateCanonicalID()
doc.ToJSON(os.Stdout)
```

**Characteristics:**
- Low-level: Manual struct construction
- Explicit: All fields must be set explicitly
- Type-safe: Go structs with strong typing
- Verbose: Requires full struct literals

### openvex-js API (TypeScript)

**Document Creation:**
```typescript
const doc = createDocument({
  author: "Wolfi J. Inkinson",
  role: "Senior VEXing Engineer",
  statements: [
    {
      vulnerability: "CVE-2021-44228",
      status: "not_affected",
      products: [
        {
          id: "pkg:maven/org.springframework.boot/spring-boot@2.6.0-M3",
          hashes: {
            "sha-256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
          },
          subcomponents: [
            { id: "pkg:apk/wolfi/bash@1.0.0" }
          ]
        }
      ],
      justification: "vulnerable_code_not_in_execute_path",
      impactStatement: "Spring Boot users are only affected..."
    }
  ]
});
```

**Characteristics:**
- High-level: Options-based API
- Flexible: Products can be strings or objects
- Concise: Less boilerplate
- Convenient: Auto-generates IDs, timestamps, etc.

## Key Differences

### 1. Input Structure

| Aspect | go-vex | openvex-js |
|--------|--------|------------|
| Document metadata | Direct field assignment | Options object |
| Statements | Array of struct literals | Array of options objects |
| Products | `Product` structs with nested `Component` | Flexible: string or object |
| Vulnerabilities | `Vulnerability` struct | String (name) or object |
| Subcomponents | `Subcomponent` structs | String or object in product |

### 2. Field Naming

| Concept | go-vex | openvex-js |
|---------|--------|------------|
| Author role | `AuthorRole` | `role` |
| Status notes | `StatusNotes` | `statusNote` |
| Action statement | `ActionStatement` | `actionStatement` |
| Impact statement | `ImpactStatement` | `impactStatement` |
| Action statement timestamp | `ActionStatementTimestamp` | Auto-generated |

### 3. Type System

| Aspect | go-vex | openvex-js |
|--------|--------|------------|
| Status | `Status` type (enum-like) | `StatementStatus` type (union) |
| Justification | `Justification` type (enum-like) | `Justification` type (union) |
| Identifiers | `map[IdentifierType]string` | `{ purl?, cpe22?, cpe23? }` |
| Hashes | `map[Algorithm]Hash` | `{ [HashAlgorithm]: string }` |

### 4. Convenience Features

| Feature | go-vex | openvex-js |
|---------|--------|------------|
| Auto ID generation | `GenerateCanonicalID()` method | Automatic if not provided |
| Auto timestamp | Manual via `time.Now()` | Automatic via `Temporal.Now` |
| Product string shorthand | No | Yes (string → Component) |
| Multiple statements | Manual append | Array in options |

## Alignment Opportunities

### Option 1: Shared JSON Input Format

Create a JSON schema that both libraries can consume:

```json
{
  "author": "Wolfi J. Inkinson",
  "role": "Senior VEXing Engineer",
  "statements": [
    {
      "vulnerability": {
        "name": "CVE-2021-44228",
        "aliases": ["GHSA-jfh8-c2jp-5v3q"]
      },
      "products": [
        {
          "id": "pkg:maven/org.springframework.boot/spring-boot@2.6.0-M3",
          "hashes": {
            "sha-256": "..."
          },
          "subcomponents": [
            { "id": "pkg:apk/wolfi/bash@1.0.0" }
          ]
        }
      ],
      "status": "not_affected",
      "justification": "vulnerable_code_not_in_execute_path",
      "impact_statement": "..."
    }
  ]
}
```

**Pros:**
- Language-agnostic
- Can be used by both libraries
- Easy to serialize/deserialize

**Cons:**
- Requires both libraries to implement parsers
- Less type-safe in Go
- May not match either library's native API

### Option 2: Align TypeScript API to Match go-vex Structure

Make TypeScript API accept a structure that mirrors go-vex's struct layout:

```typescript
interface AlignedCreateOptions {
  author: string;
  authorRole?: string;  // Match go-vex's AuthorRole
  statements: AlignedStatement[];
}

interface AlignedStatement {
  vulnerability: {
    id?: string;
    name: string;
    description?: string;
    aliases?: string[];
  };
  products: AlignedProduct[];
  status: StatementStatus;
  statusNotes?: string;  // Match go-vex's StatusNotes
  justification?: Justification;
  impactStatement?: string;
  actionStatement?: string;
  actionStatementTimestamp?: string;
  supplier?: string;
}

interface AlignedProduct {
  component: {
    id?: string;
    identifiers?: {
      purl?: string;
      cpe22?: string;
      cpe23?: string;
    };
    hashes?: Record<HashAlgorithm, string>;
  };
  subcomponents?: Array<{
    component: {
      id?: string;
      identifiers?: {...};
      hashes?: {...};
    };
  }>;
}
```

**Pros:**
- Direct mapping to go-vex structs
- Easier to convert between libraries
- More explicit structure

**Cons:**
- More verbose than current API
- Less convenient (no string shorthand)
- Breaking change for existing users

### Option 3: Hybrid Approach (Recommended)

Keep current convenient API, but add a "strict mode" that matches go-vex structure:

```typescript
// Current convenient API (unchanged)
createDocument({
  author: "...",
  statements: [
    {
      vulnerability: "CVE-123",
      products: ["pkg:..."]  // string shorthand
    }
  ]
});

// New aligned API (optional)
createDocumentStrict({
  author: "...",
  authorRole: "...",
  statements: [
    {
      vulnerability: {
        name: "CVE-123",
        aliases: [...]
      },
      products: [
        {
          component: {
            id: "pkg:...",
            identifiers: {...},
            hashes: {...}
          },
          subcomponents: [...]
        }
      ],
      status: "not_affected",
      statusNotes: "...",  // Match go-vex naming
      justification: "..."
    }
  ]
});
```

**Pros:**
- Backward compatible
- Best of both worlds
- Can generate go-vex-compatible JSON

**Cons:**
- Two APIs to maintain
- More complexity

### Option 4: Conversion Utilities

Keep APIs separate but provide conversion utilities:

```typescript
// Convert go-vex JSON to openvex-js options
function fromGoVexJson(goVexJson: GoVexJson): CreateDocumentOptions {
  // ...
}

// Convert openvex-js document to go-vex compatible JSON
function toGoVexJson(doc: OpenVexDocument): GoVexJson {
  // ...
}
```

**Pros:**
- No breaking changes
- Flexible
- Can work with any format

**Cons:**
- Doesn't solve the "same inputs" goal
- Requires conversion step

## Recommendation

**Option 3 (Hybrid Approach)** is recommended because:

1. **Backward Compatible**: Existing TypeScript code continues to work
2. **Alignment**: New strict API matches go-vex structure exactly
3. **Flexibility**: Users can choose convenience or strictness
4. **Interoperability**: Strict API can generate JSON that go-vex can consume directly

## Implementation Plan

1. **Add aligned types** that match go-vex structs exactly
2. **Add `createDocumentStrict()`** function with aligned API
3. **Add conversion utilities** between formats
4. **Document both APIs** with examples
5. **Add tests** that verify go-vex compatibility

## Field Name Alignment

To match go-vex exactly, consider these renames in strict mode:

| Current (openvex-js) | go-vex | Strict Mode |
|---------------------|--------|-------------|
| `role` | `AuthorRole` | `authorRole` |
| `statusNote` | `StatusNotes` | `statusNotes` |
| `actionStatement` | `ActionStatement` | `actionStatement` (same) |
| `impactStatement` | `ImpactStatement` | `impactStatement` (same) |

Note: JSON field names remain `status_notes`, `action_statement`, etc. per spec.

## Architectural Considerations: Class-Based vs Functional API

### Current Approach: Functional API

The TypeScript library currently uses a functional approach:

```typescript
// Creation
const doc = createDocument({ author: "...", statements: [...] });

// Parsing
const doc = parseOpenVexDocument(jsonString);

// Utilities
const product = createProduct("pkg:...");
const statement = createStatement({...});
```

**Characteristics:**
- ✅ Modern TypeScript style (prefers functions)
- ✅ Tree-shakeable (only import what you use)
- ✅ Immutable by default (returns new objects)
- ✅ Easy to test (pure functions)
- ❌ No encapsulation (behavior separate from data)
- ❌ No method chaining
- ❌ Less similar to go-vex's struct methods

### go-vex Approach: Struct Methods (Class-like)

go-vex uses methods on structs, similar to classes:

```go
doc := vex.New()
doc.Author = "..."
doc.GenerateCanonicalID()  // Method on VEX
doc.ToJSON(os.Stdout)      // Method on VEX

stmt := vex.Statement{...}
stmt.Validate()            // Method on Statement
stmt.Matches(...)          // Method on Statement

comp := vex.Component{...}
comp.Matches(...)          // Method on Component
```

**go-vex Methods:**

**VEX struct methods:**
- `ToJSON(w io.Writer) error`
- `MarshalJSON() ([]byte, error)`
- `EffectiveStatement(product, vulnID string) *Statement`
- `Matches(vulnID, product string, subcomponents []string) []Statement`
- `CanonicalHash() (string, error)`
- `GenerateCanonicalID() (string, error)`
- `StatementsByVulnerability(id string) []Statement`
- `ExtractStatements() []*Statement`

**Statement struct methods:**
- `Validate() error`
- `Matches(vuln, product string, subcomponents []string) bool`
- `MatchesProduct(identifier, subidentifier string) bool`
- `DeepCopy() *Statement`

**Component struct methods:**
- `Matches(identifier string) bool`

**Characteristics:**
- ✅ Encapsulation (behavior with data)
- ✅ Method chaining possible
- ✅ DDD-friendly (domain entities with behavior)
- ✅ Similar to OOP patterns
- ❌ Less "modern" TypeScript style
- ❌ Methods on types (not classes) in Go

### Domain-Driven Design (DDD) Perspective

From a DDD perspective, the domain entities should encapsulate their behavior:

**Domain Entities:**
- `Document` - encapsulates document-level operations
- `Statement` - encapsulates statement validation and matching
- `Product` / `Component` - encapsulates product matching logic
- `Vulnerability` - encapsulates vulnerability matching

**Current State:**
- Behavior is in separate functions (`createDocument`, `parseOpenVexDocument`)
- Data structures are plain types/interfaces
- No encapsulation of domain logic

**DDD Ideal:**
- `Document` class with methods: `validate()`, `toJSON()`, `generateCanonicalID()`, `findStatement()`
- `Statement` class with methods: `validate()`, `matches()`, `toJSON()`
- `Component` class with methods: `matches()`, `toJSON()`

## Decision Point: Functional vs Class-Based API

**Note:** This library is not yet published, so breaking changes are acceptable. We should choose ONE approach (functional OR class-based), not both.

### Option A: Functional API

**Current Implementation:**
```typescript
// Creation
const doc = createDocument({
  author: "Security Team",
  statements: [
    {
      vulnerability: "CVE-2023-12345",
      status: "fixed",
      products: ["pkg:apk/wolfi/git@2.39.0-r1"]
    }
  ]
});

// Parsing
const doc = parseOpenVexDocument(jsonString);

// Utilities (separate functions)
const json = JSON.stringify(doc);
const canonicalId = generateCanonicalId(doc);
const statement = findEffectiveStatement(doc, product, vuln);
const statements = findMatchingStatements(doc, vulnID, product, subcomponents);
const byVuln = getStatementsByVulnerability(doc, vulnID);
```

**Characteristics:**
- ✅ Modern TypeScript style (prefers functions)
- ✅ Tree-shakeable (only import what you use)
- ✅ Immutable by default (returns new objects)
- ✅ Easy to test (pure functions)
- ✅ Functional programming patterns
- ✅ No `this` context issues
- ❌ No encapsulation (behavior separate from data)
- ❌ No method chaining
- ❌ Less aligned with go-vex's struct methods
- ❌ Less DDD-friendly (behavior not co-located with data)
- ❌ More verbose for common operations

**API Surface:**
```typescript
// Factory functions
createDocument(options: CreateDocumentOptions): OpenVexDocument
createStatement(options: CreateStatementOptions): Statement
createProduct(identifier: string): Component
createSubcomponent(input: SubcomponentInput): Subcomponent
createVulnerability(name: string, aliases?: string[]): Vulnerability

// Parsing
parseOpenVexDocument(json: string): OpenVexDocument
parseOpenVexDocumentFromUnknown(input: unknown): OpenVexDocument

// Document operations (separate functions)
generateCanonicalId(doc: OpenVexDocument): string
findEffectiveStatement(doc: OpenVexDocument, product: string, vulnID: string): Statement | null
findMatchingStatements(doc: OpenVexDocument, vulnID: string, product: string, subcomponents?: string[]): Statement[]
getStatementsByVulnerability(doc: OpenVexDocument, id: string): Statement[]
extractStatements(doc: OpenVexDocument): Statement[]
getCanonicalHash(doc: OpenVexDocument): string

// Statement operations
validateStatement(stmt: Statement): void
statementMatches(stmt: Statement, vuln: string, product: string, subcomponents?: string[]): boolean
statementMatchesProduct(stmt: Statement, identifier: string, subidentifier?: string): boolean

// Component operations
componentMatches(comp: Component, identifier: string): boolean
```

### Option B: Class-Based API (DDD-aligned)

**Proposed Implementation:**
```typescript
// Creation
const doc = OpenVexDocument.create({
  author: "Security Team",
  statements: [
    {
      vulnerability: "CVE-2023-12345",
      status: "fixed",
      products: ["pkg:apk/wolfi/git@2.39.0-r1"]
    }
  ]
});

// Parsing
const doc = OpenVexDocument.parse(jsonString);

// Operations (methods on the object)
doc.generateCanonicalID();
const json = doc.toJSON();
const statement = doc.effectiveStatement(product, vulnID);
const statements = doc.matches(vulnID, product, subcomponents);
const byVuln = doc.statementsByVulnerability(vulnID);
const hash = doc.canonicalHash();
```

**Characteristics:**
- ✅ Encapsulation of domain logic
- ✅ Method chaining possible
- ✅ Aligned with go-vex structure (struct methods)
- ✅ DDD-friendly (behavior co-located with data)
- ✅ More intuitive API (operations on the object)
- ✅ Less verbose for common operations
- ✅ Clear ownership (methods belong to the entity)
- ❌ Less "modern" TypeScript style (classes vs functions)
- ❌ Classes are less tree-shakeable (though methods can be)
- ❌ More OOP overhead
- ❌ `this` context considerations

**API Surface:**
```typescript
class OpenVexDocument {
  // Factory methods
  static create(options: CreateDocumentOptions): OpenVexDocument
  static parse(json: string): OpenVexDocument
  static parseFromUnknown(input: unknown): OpenVexDocument
  
  // Instance methods
  validate(): void
  toJSON(): string
  generateCanonicalID(): string
  canonicalHash(): string
  effectiveStatement(product: string, vulnID: string): Statement | null
  matches(vulnID: string, product: string, subcomponents?: string[]): Statement[]
  statementsByVulnerability(id: string): Statement[]
  extractStatements(): Statement[]
  
  // Getters for data access
  get context(): string
  get id(): string
  get author(): string
  get role(): string | undefined
  get timestamp(): string
  get version(): number
  get statements(): Statement[]
}

class Statement {
  // Factory method
  static create(options: CreateStatementOptions): Statement
  
  // Instance methods
  validate(): void
  matches(vuln: string, product: string, subcomponents?: string[]): boolean
  matchesProduct(identifier: string, subidentifier?: string): boolean
  toJSON(): string
  
  // Getters
  get id(): string | undefined
  get vulnerability(): Vulnerability
  get products(): Component[]
  get status(): StatementStatus
  // ... etc
}

class Component {
  // Factory method
  static create(identifier: string): Component
  static createWithHashes(identifier: string, hashes: Hashes): Component
  
  // Instance methods
  matches(identifier: string): boolean
  toJSON(): string
  
  // Getters
  get id(): string | undefined
  get identifiers(): Identifiers | undefined
  get hashes(): Hashes | undefined
}

class Vulnerability {
  // Factory method
  static create(name: string, aliases?: string[]): Vulnerability
  
  // Instance methods
  matches(identifier: string): boolean
  toJSON(): string
  
  // Getters
  get id(): string | undefined
  get name(): string
  get aliases(): string[] | undefined
}
```

### Detailed Comparison

| Aspect | Functional API | Class-Based API |
|--------|---------------|-----------------|
| **TypeScript Style** | ✅ Modern (prefers functions) | ⚠️ More OOP (classes) |
| **Encapsulation** | ❌ Behavior separate from data | ✅ Behavior with data |
| **go-vex Alignment** | ❌ Different pattern | ✅ Matches struct methods |
| **DDD-friendly** | ❌ No domain encapsulation | ✅ Proper domain entities |
| **Tree-shakeable** | ✅ Yes (individual functions) | ⚠️ Partial (class methods) |
| **Method Chaining** | ❌ No | ✅ Yes |
| **Immutability** | ✅ Returns new objects | ⚠️ Can be mutable or immutable |
| **Testing** | ✅ Easy (pure functions) | ✅ Easy (instance methods) |
| **Verbosity** | ⚠️ More verbose (function calls) | ✅ Less verbose (methods) |
| **Intuition** | ⚠️ Operations are separate | ✅ Operations on the object |
| **Code Organization** | ⚠️ Functions in separate files | ✅ Methods in class files |
| **IDE Support** | ✅ Good (function autocomplete) | ✅ Excellent (method autocomplete) |
| **Learning Curve** | ✅ Lower (just functions) | ⚠️ Slightly higher (OOP concepts) |

### Usage Examples Comparison

**Creating and using a document:**

**Functional:**
```typescript
const doc = createDocument({ author: "...", statements: [...] });
const id = generateCanonicalId(doc);
const json = JSON.stringify(doc);
const stmt = findEffectiveStatement(doc, "pkg:...", "CVE-123");
```

**Class-Based:**
```typescript
const doc = OpenVexDocument.create({ author: "...", statements: [...] });
const id = doc.generateCanonicalID();
const json = doc.toJSON();
const stmt = doc.effectiveStatement("pkg:...", "CVE-123");
```

**Parsing and validating:**

**Functional:**
```typescript
const doc = parseOpenVexDocument(jsonString);
// Validation happens during parse, or:
validateDocument(doc); // if separate function
```

**Class-Based:**
```typescript
const doc = OpenVexDocument.parse(jsonString);
doc.validate(); // explicit validation
```

**Working with statements:**

**Functional:**
```typescript
const stmt = createStatement({...});
validateStatement(stmt);
const matches = statementMatches(stmt, vuln, product);
```

**Class-Based:**
```typescript
const stmt = Statement.create({...});
stmt.validate();
const matches = stmt.matches(vuln, product);
```

### Recommendation

**Choose Class-Based API (Option B)** if:
- ✅ You want alignment with go-vex's method-based approach
- ✅ You value DDD principles and domain encapsulation
- ✅ You want a more intuitive API (operations on objects)
- ✅ You prefer less verbose code for common operations
- ✅ You want method chaining capabilities

**Choose Functional API (Option A)** if:
- ✅ You prefer modern TypeScript functional patterns
- ✅ You prioritize tree-shaking and bundle size
- ✅ You want maximum immutability guarantees
- ✅ You prefer explicit function calls over methods
- ✅ You want to avoid OOP overhead

### Implementation Considerations

**If choosing Class-Based:**

1. **Structure:**
   ```
   src/
     classes/
       document.ts      # OpenVexDocument class
       statement.ts     # Statement class
       component.ts     # Component class
       vulnerability.ts # Vulnerability class
     types.ts           # Type definitions
     schemas.ts         # Zod schemas (unchanged)
   ```

2. **Factory Methods:**
   - `OpenVexDocument.create()` - wraps current `createDocument()`
   - `OpenVexDocument.parse()` - wraps current `parseOpenVexDocument()`
   - Static methods for creation, instance methods for operations

3. **Internal Implementation:**
   - Classes can delegate to internal functions for logic
   - Keep validation logic in Zod schemas
   - Methods call internal helpers

4. **Migration Path:**
   - Refactor `createDocument()` → `OpenVexDocument.create()`
   - Refactor `parseOpenVexDocument()` → `OpenVexDocument.parse()`
   - Move query functions → instance methods
   - Update all tests to use classes

**If choosing Functional:**

1. **Keep current structure** but organize better:
   ```
   src/
     create.ts          # createDocument, createStatement, etc.
     parse.ts           # parseOpenVexDocument, etc.
     query.ts           # findEffectiveStatement, matches, etc.
     types.ts           # Type definitions
     schemas.ts         # Zod schemas
   ```

2. **Enhancements:**
   - Add missing query functions to match go-vex methods
   - Ensure all operations are pure functions
   - Document function organization clearly

### Conclusion

Given the goals of:
- **Alignment with go-vex** (struct methods)
- **DDD principles** (domain encapsulation)
- **Intuitive API** (operations on objects)

**Recommendation: Choose Class-Based API (Option B)**

This provides the best alignment with go-vex while maintaining proper domain modeling. The library is not published, so we can make this architectural decision now without breaking changes.
