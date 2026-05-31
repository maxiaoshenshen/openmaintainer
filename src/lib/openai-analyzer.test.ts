import { afterEach, describe, expect, it } from "vitest";
import { demoRepository } from "./demo-data";
import { analyzeWithOpenAI } from "./openai-analyzer";

const originalKey = process.env.OPENAI_API_KEY;

afterEach(() => {
  process.env.OPENAI_API_KEY = originalKey;
});

describe("analyzeWithOpenAI", () => {
  it("falls back to deterministic analysis when no OpenAI API key is configured", async () => {
    delete process.env.OPENAI_API_KEY;

    const result = await analyzeWithOpenAI(demoRepository);

    expect(result.provider).toBe("deterministic");
    expect(result.analysis.triage.length).toBeGreaterThan(0);
  });
});
