import { NextRequest, NextResponse } from "next/server";
import { analyzeCommunityHealth } from "@/lib/community-health";
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
      getPullRequests(owner,  repo, { state: "all" }),
    ]);

    const healthReport = analyzeCommunityHealth(repoData, contributors, issues, prs);

    return NextResponse.json(healthReport);
  } catch (error) {
    console.error("Health report error:", error);
    return NextResponse.json(
      { error: "Failed to generate health report" },
      { status: 500 }
    );
  }
}
