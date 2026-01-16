import { describe, expect, it } from "vitest";
import { getOpenVexContext, getVersion } from "../src/index.js";

describe("OpenVEX Library", () => {
  describe("getOpenVexContext", () => {
    it("should return the default context URL", () => {
      const context = getOpenVexContext();
      expect(context).toBe("https://openvex.dev/ns/v0.2.0");
    });

    it("should return the context URL for a specific version", () => {
      const context = getOpenVexContext("v0.1.0");
      expect(context).toBe("https://openvex.dev/ns/v0.1.0");
    });
  });

  describe("getVersion", () => {
    it("should return the current library version", () => {
      const version = getVersion();
      expect(version).toBe("0.0.0");
    });
  });
});
