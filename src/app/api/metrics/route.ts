import { NextResponse } from 'next/server';
import { metricsExporter } from '@/lib/metrics-exporter';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  // Add some demo metrics
  metricsExporter.addGauge('openmaintainer_analyses_total', 'Total repository analyses performed', 45678, { service: 'api' });
  metricsExporter.addGauge('openmaintainer_users_active', 'Number of active users', 1234, { service: 'api' });
  metricsExporter.addGauge('openmaintainer_exports_total', 'Total data exports', 12345, { service: 'api' });
  metricsExporter.addGauge('openmaintainer_api_calls', 'Total API calls', 234567, { service: 'api' });
  metricsExporter.addCounter('openmaintainer_requests_total', 'Total HTTP requests', 890123, { endpoint: 'api' });
  metricsExporter.addGauge('openmaintainer_avg_response_time_ms', 'Average API response time in ms', 142, { service: 'api' });

  const metrics = metricsExporter.export();

  return new NextResponse(metrics, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}
