import { NextResponse } from 'next/server';
import { createReleaseManager } from '@/lib/release-manager';

export async function GET() {
  const manager = createReleaseManager();
  const plan = manager.generateReleasePlan({
    id: '1',
    name: 'sample-repo',
    fullName: 'owner/sample-repo',
    owner: 'owner',
    description: 'Sample repository',
    isPrivate: false,
    stars: 100,
    forks: 20,
    openIssues: 10,
    language: 'TypeScript'
  });

  return NextResponse.json(plan);
}
