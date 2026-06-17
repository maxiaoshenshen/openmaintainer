import { NextResponse } from 'next/server';
import { createContributorManager } from '@/lib/contributor-manager';

export async function GET() {
  const manager = createContributorManager();
  const report = manager.generateReport({
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

  return NextResponse.json(report);
}
