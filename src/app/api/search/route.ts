import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface SearchResult {
  type: 'repository' | 'issue' | 'pr' | 'contributor';
  title: string;
  description: string;
  url: string;
  stars?: number;
  score: number;
}

// Simulated search index for demo
const searchIndex: SearchResult[] = [
  {
    type: 'repository',
    title: 'openmaintainer/maintainer-tools',
    description: 'AI-powered OSS maintenance workbench',
    url: 'https://github.com/openmaintainer/maintainer-tools',
    stars: 1250,
    score: 100,
  },
  {
    type: 'repository',
    title: 'vercel/next.js',
    description: 'The React Framework for Production',
    url: 'https://github.com/vercel/next.js',
    stars: 125000,
    score: 95,
  },
  {
    type: 'repository',
    title: 'facebook/react',
    description: 'The library for web and native user interfaces',
    url: 'https://github.com/facebook/react',
    stars: 225000,
    score: 90,
  },
  {
    type: 'issue',
    title: 'Feature: Add contributor journey tracking',
    description: 'Track and visualize contributor growth over time',
    url: 'https://github.com/openmaintainer/maintainer-tools/issues/42',
    score: 85,
  },
  {
    type: 'pr',
    title: 'Fix: Resolve merge conflicts in PR #156',
    description: 'Resolved conflicts between feature branch and main',
    url: 'https://github.com/openmaintainer/maintainer-tools/pull/156',
    score: 80,
  },
  {
    type: 'contributor',
    title: 'Sarah Chen',
    description: 'Core maintainer, 500+ contributions',
    url: 'https://github.com/sarahchen',
    score: 75,
  },
];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type');
  const limit = parseInt(searchParams.get('limit') || '10');

  if (!query || query.length < 2) {
    return NextResponse.json(
      { results: [], message: 'Query must be at least 2 characters' },
      { status: 400 }
    );
  }

  const queryLower = query.toLowerCase();
  let results = searchIndex.filter((item) => {
    const matchesQuery =
      item.title.toLowerCase().includes(queryLower) ||
      item.description.toLowerCase().includes(queryLower);
    const matchesType = !type || item.type === type;
    return matchesQuery && matchesType;
  });

  // Sort by relevance score
  results.sort((a, b) => b.score - a.score);
  results = results.slice(0, limit);

  return NextResponse.json({
    query,
    total: results.length,
    results,
  });
}
