import { NextResponse } from "next/server";
import { cacheManager } from "@/lib/cache-manager";

export async function GET() {
  const cacheStats = cacheManager.getStats();
  
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "0.2.0",
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    services: {
      cache: {
        status: "operational",
        ...cacheStats,
      },
      api: {
        status: "operational",
      },
    },
  };

  return NextResponse.json(health, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
