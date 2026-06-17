import { NextRequest, NextResponse } from "next/server";
import { generateInsights, InsightsContext } from "@/lib/ai-insights-engine";
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
      getPullRequests(owner, repo, { state: "all" }),
    ]);

    // Calculate context metrics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentIssues = issues.filter(i => new Date(i.createdAt) > thirtyDaysAgo);
    const recentPRs = prs.filter(p => new Date(p.createdAt) > thirtyDaysAgo);
    
    const closedIssues = issues.filter(i => i.state === 'closed');
    const mergedPRs = prs.filter(p => p.mergedAt);
    
    // Calculate contributor stats from array
    const totalContributors = contributors.length;
    const activeContributors = contributors.filter(c => c.contributions > 10).length;
    const newContributors = contributors.filter(c => c.contributions <= 5).length;
    
    // Build context object
    const context: InsightsContext = {
      repository: {
        name: repoData.fullName,
        stars: repoData.stars,
        forks: repoData.forks,
        openIssues: repoData.openIssues,
        openPRs: repoData.openPRs,
        lastReleaseAt: new Date(),
      },
      contributors: {
        total: totalContributors,
        active: activeContributors,
        newThisMonth: newContributors,
        churned: 0,
      },
      activity: {
        issuesPerWeek: recentIssues.length / 4,
        prsPerWeek: recentPRs.length / 4,
        avgResponseTime: 24,
        reviewTime: 48,
      },
      health: {
        issueResolutionRate: issues.length > 0 ? closedIssues.length / issues.length : 0.5,
        prMergeRate: prs.length > 0 ? mergedPRs.length / prs.length : 0.5,
        communityEngagement: totalContributors > 0 ? Math.min(activeContributors / totalContributors, 1) : 0.5,
      },
    };

    const insights = generateInsights(context);

    return NextResponse.json(insights);
  } catch (error) {
    console.error("Insights generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}
