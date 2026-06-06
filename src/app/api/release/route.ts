import { NextRequest, NextResponse } from "next/server";
import { planRelease, getReleaseReadiness } from "@/lib/release-manager";
import { getRepository, getPullRequests, getIssues } from "@/lib/github-api";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const repoFullName = searchParams.get("repo");
  const currentVersion = searchParams.get("version") || undefined;

  if (!repoFullName) {
    return NextResponse.json(
      { error: "Missing 'repo' parameter" },
      { status: 400 }
    );
  }

  try {
    const [owner, repo] = repoFullName.split("/");

    const [repoData, prs, issues] = await Promise.all([
      getRepository(owner, repo),
      getPullRequests(owner, repo, { state: "closed" }),
      getIssues(owner, repo, { state: "closed" }),
    ]);

    const mergedPRs = prs.filter((pr) => pr.mergedAt);
    const closedIssues = issues.filter((i) => i.state === "closed");

    const releasePlan = planRelease(repoData, mergedPRs, closedIssues, currentVersion);
    const readiness = getReleaseReadiness(releasePlan);

    return NextResponse.json({
      releasePlan,
      readiness,
    });
  } catch (error) {
    console.error("Release planning error:", error);
    return NextResponse.json(
      { error: "Failed to plan release" },
      { status: 500 }
    );
  }
}
