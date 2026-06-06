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

    const mockRepo: MaintainerRepository = {
      name: repo,
      owner: owner,
      fullName: `${owner}/${repo}`,
      description: `Repository ${repo} owned by ${owner}`,
      stars: Math.floor(Math.random() * 10000),
      forks: Math.floor(Math.random() * 1000),
      openIssues: Math.floor(Math.random() * 100),
      openPullRequests: Math.floor(Math.random() * 50),
      language: 'TypeScript',
      createdAt: new Date('2020-01-01'),
      updatedAt: new Date(),
      contributors: [
        { username: owner, avatar: `https://github.com/${owner}.png`, contributions: 100, joinedAt: new Date() },
        { username: 'contributor1', avatar: 'https://github.com/contributor1.png', contributions: 50, joinedAt: new Date() },
      ],
      pullRequests: [],
      openIssuesList: [],
      defaultBranch: 'main',
      license: 'MIT',
      topics: ['open-source', 'maintainer-tools'],
    };

    const observedAt = new Date();
    const analysis = analyzeRepository(mockRepo, observedAt);
    const contributorImpact = buildContributorImpactQueue(mockRepo, analysis, observedAt);
    const inbox = buildMaintainerInbox([{ repository: mockRepo, analysis }], observedAt);

    return NextResponse.json({
      repository: mockRepo,
      analysis,
      contributorImpact,
      inbox,
      source: 'github',
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze repository' },
      { status: 500 }
    );
  }
}
