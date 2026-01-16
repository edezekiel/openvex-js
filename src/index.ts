// OpenVEX TypeScript Library
// Main entry point - exports will be added as implementation progresses

/**
 * Get the OpenVEX context URL for a given version.
 * @param version - The OpenVEX version (default: "v0.2.0")
 * @returns The context URL for the specified version
 */
export function getOpenVexContext(version = "v0.2.0"): string {
  return `https://openvex.dev/ns/${version}`;
}

/**
 * Get the library version.
 * @returns The current library version
 */
export function getVersion(): string {
  return "0.0.0";
}
