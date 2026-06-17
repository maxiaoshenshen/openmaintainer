import { NextResponse } from "next/server";
import { perfMonitor } from "@/lib/performance-monitor";

export async function GET() {
  const snapshot = perfMonitor.getSnapshot();
  
  return NextResponse.json({
    ...snapshot,
    uptime: perfMonitor.getUptime(),
    timestamp: new Date().toISOString(),
  });
}
