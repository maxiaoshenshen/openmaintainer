import { analyzeRepository } from "@/lib/maintainer-analysis";
import { getRepositoryOrDemo } from "@/lib/github";
import { demoPreviousSnapshot } from "@/lib/demo-data";
import type { RepositoryAnalysisSnapshot } from "@/lib/types";

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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const repoInput = url.searchParams.get("repo");
  const previousSnapshot = parsePreviousSnapshot(url.searchParams.get("previousSnapshot"));
  const result = await getRepositoryOrDemo(repoInput);
  const analysis = analyzeRepository(
    result.repository,
    new Date(),
    previousSnapshot ?? (result.source === "demo" ? demoPreviousSnapshot : undefined),
  );

  return Response.json({
    ...result,
    analysis,
  });
}
