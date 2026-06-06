import { NextRequest, NextResponse } from "next/server";
import { createSprintPlan, estimateReleaseDate } from "@/lib/sprint-planning";
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

    const sprintPlan = createSprintPlan(repoData, issues, prs, contributors);
    const remainingIssues = issues.filter((i) => i.state === "open").length;
    const estimatedRelease = estimateReleaseDate(
      remainingIssues,
      sprintPlan.velocity,
      sprintPlan.currentSprint
    );

    return NextResponse.json({
      ...sprintPlan,
      estimatedNextRelease: estimatedRelease.toISOString(),
    });
  } catch (error) {
    console.error("Sprint plan error:", error);
    return NextResponse.json(
      { error: "Failed to generate sprint plan" },
      { status: 500 }
    );
  }
}
