import { describe, expect, it } from "vitest";
import { DocumentBuilder } from "../src/index.js";

describe("OpenVEX Library", () => {
  it("should export DocumentBuilder class", () => {
    expect(DocumentBuilder).toBeDefined();
    expect(typeof DocumentBuilder.create).toBe("function");
    expect(typeof DocumentBuilder.parse).toBe("function");
  });
});
