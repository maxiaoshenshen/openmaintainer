import { describe, expect, it } from "vitest";
import { parseRepositoryInput } from "./github";

describe("parseRepositoryInput", () => {
  it("parses owner/name shorthand", () => {
    expect(parseRepositoryInput("vercel/next.js")).toMatchObject({
      owner: "vercel",
      name: "next.js",
      fullName: "vercel/next.js",
    });
  });

  it("parses GitHub repository URLs", () => {
    expect(parseRepositoryInput("https://github.com/openai/openai-cookbook")).toMatchObject({
      owner: "openai",
      name: "openai-cookbook",
      fullName: "openai/openai-cookbook",
    });
  });

  it("rejects unsupported repository input", () => {
    expect(() => parseRepositoryInput("not a repository")).toThrow("Enter a GitHub repository");
  });
});
