import { analyzeRepository } from "@/lib/maintainer-analysis";
import { getRepositoryOrDemo } from "@/lib/github";
import { demoPreviousSnapshot } from "@/lib/demo-data";
import type { MaintainerSettings, RepositoryAnalysisSnapshot } from "@/lib/types";

function parsePreviousSnapshot(value: string | null): RepositoryAnalysisSnapshot | undefined {
  if (!value) return undefined;

  try {
    const parsed = JSON.parse(value) as RepositoryAnalysisSnapshot;
    if (!parsed.capturedAt || !Array.isArray(parsed.qualitySignals)) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

function parseSettings(value: string | null): Partial<MaintainerSettings> | undefined {
  if (!value) return undefined;

  try {
    const parsed = JSON.parse(value) as Partial<MaintainerSettings>;
    return {
      targetLabelCoverage: parsed.targetLabelCoverage,
      maxIssueResponseDays: parsed.maxIssueResponseDays,
      maxPullRequestAgeDays: parsed.maxPullRequestAgeDays,
      maxOpenPullRequests: parsed.maxOpenPullRequests,
      releaseCadenceDays: parsed.releaseCadenceDays,
      preferredLabels: Array.isArray(parsed.preferredLabels) ? parsed.preferredLabels : undefined,
    };
  } catch {
    return undefined;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const repoInput = url.searchParams.get("repo");
  const previousSnapshot = parsePreviousSnapshot(url.searchParams.get("previousSnapshot"));
  const settings = parseSettings(url.searchParams.get("settings"));
  const result = await getRepositoryOrDemo(repoInput);
  const analysis = analyzeRepository(
    result.repository,
    new Date(),
    previousSnapshot ?? (result.source === "demo" ? demoPreviousSnapshot : undefined),
    settings,
  );

  return Response.json({
    ...result,
    analysis,
  });
}
