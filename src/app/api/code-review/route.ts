import { NextRequest, NextResponse } from "next/server";
import { performCodeReview } from "@/lib/code-review-assistant";
import { getRepository, getPullRequest, getContributors } from "@/lib/github-api";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const repoFullName = searchParams.get("repo");
  const prNumber = searchParams.get("pr");

  if (!repoFullName || !prNumber) {
    return NextResponse.json(
      { error: "Missing 'repo' or 'pr' parameter" },
      { status: 400 }
    );
  }

  try {
    const [owner, repo] = repoFullName.split("/");
    const prNum = parseInt(prNumber, 10);

    const [repoData, pr, contributors] = await Promise.all([
      getRepository(owner, repo),
      getPullRequest(owner, repo, prNum),
      getContributors(owner, repo),
    ]);

    const reviewer = contributors.find((c) => c.contributions > 10) || null;
    const review = performCodeReview({ pr, repo: repoData, reviewer });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Code review error:", error);
    return NextResponse.json(
      { error: "Failed to perform code review" },
      { status: 500 }
    );
  }
}
