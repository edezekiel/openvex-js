import { describe, expect, it } from "vitest";
import { OpenVexDocument } from "../src/index.js";

describe("OpenVEX Library", () => {
  it("should export OpenVexDocument class", () => {
    expect(OpenVexDocument).toBeDefined();
    expect(typeof OpenVexDocument.create).toBe("function");
    expect(typeof OpenVexDocument.parse).toBe("function");
  });
});
