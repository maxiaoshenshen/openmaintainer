import { analyzeRepository } from "@/lib/maintainer-analysis";
import { getRepositoryOrDemo } from "@/lib/github";
import { demoPreviousSnapshot } from "@/lib/demo-data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const repoInput = url.searchParams.get("repo");
  const result = await getRepositoryOrDemo(repoInput);
  const analysis = analyzeRepository(
    result.repository,
    new Date(),
    result.source === "demo" ? demoPreviousSnapshot : undefined,
  );

  return Response.json({
    ...result,
    analysis,
  });
}
