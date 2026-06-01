import { describe, expect, it } from "vitest";
import { parseInboxRepositoryInputs } from "./inbox-input";

describe("parseInboxRepositoryInputs", () => {
  it("normalizes multiline, comma-separated, and URL repository inputs", () => {
    expect(
      parseInboxRepositoryInputs(
        "vercel/next.js, https://github.com/openai/openai-cookbook\nvercel/next.js\nfacebook/react",
      ),
    ).toEqual(["vercel/next.js", "openai/openai-cookbook", "facebook/react"]);
  });

  it("limits portfolios to six repositories for a fast maintainer inbox", () => {
    expect(
      parseInboxRepositoryInputs(
        [
          "owner/one",
          "owner/two",
          "owner/three",
          "owner/four",
          "owner/five",
          "owner/six",
          "owner/seven",
        ].join("\n"),
      ),
    ).toHaveLength(6);
  });
});
