import { NextResponse } from 'next/server';
import { createSecurityScanner } from '@/lib/security-scanner';

export async function GET() {
  const scanner = createSecurityScanner();
  
  // Start a scan
  const scanResult = scanner.startScan('scan-1', 'owner/sample-repo', 'main');
  
  // Complete the scan with file count
  const result = scanner.completeScan('scan-1', 100);

  return NextResponse.json({
    scanId: result.id,
    status: result.status,
    summary: result.summary,
  });
}
