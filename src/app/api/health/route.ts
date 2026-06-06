import { NextResponse } from 'next/server';
import { healthChecker } from '@/lib/health-checker';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const report = await healthChecker.runAllChecks();
    return NextResponse.json(report, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to run health checks', details: String(error) },
      { status: 500 }
    );
  }
}
