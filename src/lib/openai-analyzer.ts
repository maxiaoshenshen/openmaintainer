import { analyzeRepository } from "./maintainer-analysis";
import type { MaintainerAnalysis, MaintainerRepository } from "./types";

type AnalyzerResult = {
  provider: "openai" | "deterministic";
  analysis: MaintainerAnalysis;
  warning?: string;
};

const analysisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    health: {
      type: "object",
      additionalProperties: false,
      properties: {
        score: { type: "number" },
        status: { type: "string", enum: ["stable", "watch", "attention"] },
        strengths: { type: "array", items: { type: "string" } },
        risks: { type: "array", items: { type: "string" } },
        nextActions: { type: "array", items: { type: "string" } },
      },
      required: ["score", "status", "strengths", "risks", "nextActions"],
    },
    triage: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          issueNumber: { type: "number" },
          category: {
            type: "string",
            enum: ["bug", "feature", "question", "documentation", "maintenance"],
          },
          priority: { type: "string", enum: ["urgent", "high", "normal", "low"] },
          suggestedLabels: { type: "array", items: { type: "string" } },
          maintainerReply: { type: "string" },
          missingInformation: { type: "array", items: { type: "string" } },
        },
        required: [
          "issueNumber",
          "category",
          "priority",
          "suggestedLabels",
          "maintainerReply",
          "missingInformation",
        ],
      },
    },
    reviews: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          pullRequestNumber: { type: "number" },
          summary: { type: "string" },
          risk: { type: "string", enum: ["high", "medium", "low"] },
          focusAreas: { type: "array", items: { type: "string" } },
          suggestedTests: { type: "array", items: { type: "string" } },
        },
        required: ["pullRequestNumber", "summary", "risk", "focusAreas", "suggestedTests"],
      },
    },
    releaseNotes: { type: "string" },
  },
  required: ["health", "triage", "reviews", "releaseNotes"],
};

function extractOutputText(response: unknown): string | null {
  if (typeof response !== "object" || response === null) return null;
  const direct = (response as { output_text?: unknown }).output_text;
  if (typeof direct === "string") return direct;

  const output = (response as { output?: unknown }).output;
  if (!Array.isArray(output)) return null;

  const parts: string[] = [];
  for (const item of output) {
    if (typeof item !== "object" || item === null) continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const contentItem of content) {
      if (typeof contentItem !== "object" || contentItem === null) continue;
      const text = (contentItem as { text?: unknown }).text;
      if (typeof text === "string") parts.push(text);
    }
  }

  return parts.length > 0 ? parts.join("\n") : null;
}

export async function analyzeWithOpenAI(repository: MaintainerRepository): Promise<AnalyzerResult> {
  const fallback = analyzeRepository(repository);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return { provider: "deterministic", analysis: fallback };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENMAINTAINER_MODEL ?? "gpt-5.4-mini",
        instructions:
          "You are OpenMaintainer, a cautious assistant for open-source maintainers. Return concise, practical, human-reviewable maintainer recommendations. Never claim certainty when repository data is insufficient.",
        input: JSON.stringify({
          repository: repository.identity.fullName,
          description: repository.description,
          metadata: {
            stars: repository.stars,
            forks: repository.forks,
            openIssues: repository.openIssues,
            license: repository.license,
          },
          issues: repository.issues.slice(0, 8),
          pullRequests: repository.pullRequests.slice(0, 6),
        }),
        text: {
          format: {
            type: "json_schema",
            name: "maintainer_analysis",
            strict: true,
            schema: analysisSchema,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed with ${response.status}`);
    }

    const data: unknown = await response.json();
    const outputText = extractOutputText(data);
    if (!outputText) throw new Error("OpenAI response did not include text output");

    return {
      provider: "openai",
      analysis: JSON.parse(outputText) as MaintainerAnalysis,
    };
  } catch (error) {
    return {
      provider: "deterministic",
      analysis: fallback,
      warning: error instanceof Error ? error.message : "OpenAI analysis failed",
    };
  }
}
