import { NextRequest, NextResponse } from "next/server";
import { createReleaseManager } from "@/lib/release-manager";
import { getRepository, getPullRequests } from "@/lib/github-api";

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

    const [repoData, prs] = await Promise.all([
      getRepository(owner, repo),
      getPullRequests(owner, repo, { state: "closed" }),
    ]);

    const manager = createReleaseManager();
    const releasePlan = manager.generateReleasePlan(repoData);

    return NextResponse.json({
      releasePlan,
    });
  } catch (error) {
    console.error("Release planning error:", error);
    return NextResponse.json(
      { error: "Failed to plan release" },
      { status: 500 }
    );
  }
}
