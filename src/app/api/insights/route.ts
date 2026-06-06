import { NextRequest, NextResponse } from "next/server";
import { generateInsights } from "@/lib/ai-insights-engine";
import { getRepository, getContributors, getIssues, getPullRequests } from "@/lib/github-api";

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

    const [repoData, contributors, issues, prs] = await Promise.all([
      getRepository(owner, repo),
      getContributors(owner, repo),
      getIssues(owner, repo),
      getPullRequests(owner, repo, "all"),
    ]);

    const insights = generateInsights(repoData, contributors, issues, prs);

    return NextResponse.json(insights);
  } catch (error) {
    console.error("Insights generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}
