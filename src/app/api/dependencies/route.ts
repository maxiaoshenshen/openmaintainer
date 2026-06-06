import { NextRequest, NextResponse } from "next/server";
import { analyzeDependencies, analyzeLicenses } from "@/lib/dependency-tracker";
import { getRepository } from "@/lib/github-api";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const repoFullName = searchParams.get("repo");
  const includeLicenses = searchParams.get("licenses") === "true";

  if (!repoFullName) {
    return NextResponse.json(
      { error: "Missing 'repo' parameter" },
      { status: 400 }
    );
  }

  try {
    const [owner, repo] = repoFullName.split("/");
    const repoData = await getRepository(owner, repo);

    const dependencyReport = analyzeDependencies(repoData);

    const response: Record<string, unknown> = {
      dependencies: dependencyReport,
    };

    if (includeLicenses) {
      response.licenses = analyzeLicenses(repoData);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Dependencies error:", error);
    return NextResponse.json(
      { error: "Failed to analyze dependencies" },
      { status: 500 }
    );
  }
}
