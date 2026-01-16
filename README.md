# openvex

TypeScript implementation of the OpenVEX specification for creating, validating, and working with VEX (Vulnerability Exploitability eXchange) documents.

## Development

### Prerequisites

- Node.js >= 24.12.0
- `vexctl` (installed via `npm run install-vexctl`)

### Setup

```bash
npm install
npm run install-vexctl
```

The `install-vexctl` script downloads the pinned version of `vexctl` (v0.4.1) from GitHub releases into `.bin/vexctl`. This binary is gitignored and used for integration tests.

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # With coverage
```

The test suite includes integration tests that execute `vexctl` and compare outputs to ensure compatibility with the reference implementation.

### CI/CD

In GitHub Actions, the `install-vexctl` job downloads the binary and caches it as an artifact. The `build-and-test` job downloads the cached binary, avoiding repeated downloads.

**GitHub Actions workflow:**
1. `install-vexctl` job: Downloads `vexctl-linux-amd64` and uploads as artifact
2. `build-and-test` job: Downloads cached artifact and uses it for tests

This approach:
- Ensures consistent versions across CI runs
- Avoids repeated downloads (uses cached artifact)
- Works on `ubuntu-latest` (Linux) runners

To update the pinned `vexctl` version, edit `VEXCTL_VERSION` in `scripts/install-vexctl.ts`.
