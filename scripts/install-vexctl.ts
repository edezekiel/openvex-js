#!/usr/bin/env node

/**
 * Install vexctl binary for testing
 * Downloads the pinned release binary from GitHub releases
 */

import { existsSync } from "node:fs";
import { chmod, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, "..");
const VEXCTL_DIR = join(ROOT_DIR, ".bin");
const VEXCTL_BINARY = join(VEXCTL_DIR, "vexctl");

// Pinned version - update this when you want to pin to a specific version
const VEXCTL_VERSION = "v0.4.1";

function getPlatformBinary(): string {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === "darwin") {
    return arch === "arm64" ? "vexctl-darwin-arm64" : "vexctl-darwin-amd64";
  }
  if (platform === "linux") {
    return arch === "arm64" ? "vexctl-linux-arm64" : "vexctl-linux-amd64";
  }
  if (platform === "win32") {
    return "vexctl-windows-amd64.exe";
  }

  throw new Error(`Unsupported platform: ${platform} ${arch}`);
}

async function downloadVexCtl(): Promise<void> {
  console.log(`Installing vexctl ${VEXCTL_VERSION}...`);

  // Ensure .bin directory exists
  if (!existsSync(VEXCTL_DIR)) {
    await mkdir(VEXCTL_DIR, { recursive: true });
  }

  // Clean existing binary to ensure idempotent installation
  if (existsSync(VEXCTL_BINARY)) {
    await rm(VEXCTL_BINARY, { force: true });
  }

  // Download binary from GitHub releases
  try {
    const binaryName = getPlatformBinary();
    const url = `https://github.com/openvex/vexctl/releases/download/${VEXCTL_VERSION}/${binaryName}`;

    console.log(`Downloading ${binaryName} from GitHub releases...`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    await writeFile(VEXCTL_BINARY, Buffer.from(buffer));
    await chmod(VEXCTL_BINARY, 0o755);

    console.log(`✓ vexctl ${VEXCTL_VERSION} installed to ${VEXCTL_BINARY}`);
  } catch (error) {
    console.error(`Failed to download vexctl: ${error instanceof Error ? error.message : String(error)}`);
    console.warn(
      `Please install vexctl manually:\n` +
        `  brew install vexctl  # macOS\n` +
        `  # or download from https://github.com/openvex/vexctl/releases/tag/${VEXCTL_VERSION}\n`,
    );

    // Create a stub that will fail gracefully
    await writeFile(
      VEXCTL_BINARY,
      `#!/usr/bin/env sh
echo "vexctl ${VEXCTL_VERSION} not found. Please install it:" >&2
echo "  brew install vexctl  # macOS" >&2
echo "  # or download from https://github.com/openvex/vexctl/releases/tag/${VEXCTL_VERSION}" >&2
exit 1
`,
    );
    await chmod(VEXCTL_BINARY, 0o755);
    throw error;
  }
}

async function main(): Promise<void> {
  try {
    await downloadVexCtl();
  } catch (error) {
    console.error("Failed to install vexctl:", error);
    process.exit(1);
  }
}

main();
