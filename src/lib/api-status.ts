/**
 * API Status Dashboard
 * Monitor API health and availability
 */
export interface APIEndpoint {
  name: string;
  url: string;
  status: "operational" | "degraded" | "down";
  latency: number;
  uptime: number;
}

export interface APIService {
  name: string;
  endpoints: APIEndpoint[];
  overallStatus: "operational" | "degraded" | "down";
}

export interface APIStatusReport {
  generatedAt: Date;
  services: APIService[];
  totalIncidents: number;
  uptimePercentage: number;
  recentIncidents: { service: string; start: Date; end?: Date; reason: string }[];
}

export function generateAPIStatus(): APIStatusReport {
  const services: APIService[] = [
    {
      name: "GitHub API",
      endpoints: [
        { name: "REST API", url: "api.github.com", status: "operational", latency: 120, uptime: 99.9 },
        { name: "GraphQL API", url: "api.github.com/graphql", status: "operational", latency: 200, uptime: 99.8 },
      ],
      overallStatus: "operational",
    },
    {
      name: "CI/CD Services",
      endpoints: [
        { name: "GitHub Actions", url: "github.com", status: "operational", latency: 500, uptime: 99.5 },
        { name: "Build Cache", url: "cache.actions.githubusercontent.com", status: "operational", latency: 50, uptime: 99.9 },
      ],
      overallStatus: "operational",
    },
  ];

  const uptimePercentage = services.reduce((sum, s) => {
    return sum + s.endpoints.reduce((eSum, e) => eSum + e.uptime, 0) / s.endpoints.length;
  }, 0) / services.length;

  return {
    generatedAt: new Date(),
    services,
    totalIncidents: 2,
    uptimePercentage: Math.floor(uptimePercentage),
    recentIncidents: [
      {
        service: "GitHub Actions",
        start: new Date("2026-05-20T10:00:00Z"),
        end: new Date("2026-05-20T10:30:00Z"),
        reason: "Increased build queue times",
      },
    ],
  };
}
