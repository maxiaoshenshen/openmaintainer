import { NextResponse } from 'next/server';
import { createReleaseManager } from '@/lib/release-manager';

export async function GET() {
  const manager = createReleaseManager();
  const plan = manager.generateReleasePlan({
    id: 1,
    name: 'sample-repo',
    fullName: 'owner/sample-repo',
    description: 'Sample repository',
    stars: 100,
    forks: 20,
    openIssues: 10,
    openPRs: 5,
    language: 'TypeScript',
    license: 'MIT',
    createdAt: '2024-01-01',
    updatedAt: '2024-06-01',
    url: 'https://github.com/owner/sample-repo'
  });

  return NextResponse.json(plan);
}
