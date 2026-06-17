import { NextResponse } from 'next/server';
import { createSecurityScanner } from '@/lib/security-scanner';

export async function GET() {
  const scanner = createSecurityScanner();
  const result = scanner.scanRepository({
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

  return NextResponse.json(result);
}
