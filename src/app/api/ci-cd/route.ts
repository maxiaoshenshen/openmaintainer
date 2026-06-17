import { NextResponse } from 'next/server';
import { createCICDMonitor } from '@/lib/ci-cd-monitor';

export async function GET() {
  const monitor = createCICDMonitor();
  const report = monitor.generateReport({
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
