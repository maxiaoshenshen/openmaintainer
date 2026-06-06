import { NextRequest, NextResponse } from "next/server";
import { analyzePerformance, generateAlerts } from "@/lib/performance-monitor";
import { getRepository, getIssues, getPullRequests } from "@/lib/github-api";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const repoFullName = searchParams.get("repo");

  if (!repoFullName) {
    return NextResponse.json(
      { error: "Missing 'repo' parameter" },
      { status: 400 }
    );
  }

  try {
    const [owner, repo] = repoFullName.split("/");

    const [repoData, issues, prs] = await Promise.all([
      getRepository(owner, repo),
      getIssues(owner, repo),
      getPullRequests(owner,  repo, { state: "all" }),
    ]);

    const metrics = analyzePerformance(repoData, issues, prs);
    const alerts = generateAlerts(metrics);

    return NextResponse.json({
      metrics,
      alerts,
    });
  } catch (error) {
    console.error("Performance analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze performance" },
      { status: 500 }
    );
  }
}
