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

  it("passes maintainer settings through deterministic fallback", async () => {
    delete process.env.OPENAI_API_KEY;

    const result = await analyzeWithOpenAI(demoRepository, {
      targetLabelCoverage: 80,
      maxIssueResponseDays: 1,
      maxPullRequestAgeDays: 2,
      maxOpenPullRequests: 1,
      releaseCadenceDays: 14,
      preferredLabels: ["bug", "documentation"],
    });

    expect(result.analysis.settings).toMatchObject({
      targetLabelCoverage: 80,
      maxOpenPullRequests: 1,
    });
    expect(result.analysis.qualitySignals).toContainEqual(
      expect.objectContaining({
        id: "review-load",
        score: 50,
      }),
    );
  });
});
