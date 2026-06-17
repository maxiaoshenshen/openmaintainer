import { NextResponse } from 'next/server';
import { createCICDMonitor } from '@/lib/ci-cd-monitor';

export async function GET() {
  const monitor = createCICDMonitor();
  const report = monitor.generateReport({
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

  return NextResponse.json(report);
}
