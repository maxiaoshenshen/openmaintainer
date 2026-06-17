import { NextRequest, NextResponse } from 'next/server';
import { analyzeRepository } from '@/lib/maintainer-analysis';
import { buildContributorImpactQueue } from '@/lib/contributor-impact';
import { buildMaintainerInbox } from '@/lib/maintainer-inbox';
import type { MaintainerRepository } from '@/lib/types';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { owner, repo } = body;

    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'Missing owner or repo parameter' },
        { status: 400 }
      );
    }

    const now = new Date();
    const mockRepo: MaintainerRepository = {
      identity: { owner, name: repo, fullName: `${owner}/${repo}`, url: `https://github.com/${owner}/${repo}` },
      description: `Repository ${repo} owned by ${owner}`,
      stars: Math.floor(Math.random() * 10000),
      forks: Math.floor(Math.random() * 1000),
      watchers: Math.floor(Math.random() * 100),
      openIssues: Math.floor(Math.random() * 100),
      closedIssues: Math.floor(Math.random() * 500),
      defaultBranch: 'main',
      license: 'MIT',
      updatedAt: now.toISOString(),
      issues: [],
      pullRequests: [],
    };

    const analysis = analyzeRepository(mockRepo, now);
    const contributorImpact = buildContributorImpactQueue(mockRepo, analysis, now);
    const inbox = buildMaintainerInbox([{ repository: mockRepo, analysis }], now);

    return NextResponse.json({
      repository: mockRepo,
      analysis,
      contributorImpact,
      inbox,
    });
  } catch (error) {
    console.error('Repository analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze repository' },
      { status: 500 }
    );
  }
}
