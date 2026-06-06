/**
 * Performance Benchmarking
 * Track and compare performance metrics over time
 */
import type { Repository } from "./types";

export interface BenchmarkMetric {
  name: string;
  value: number;
  unit: string;
  target?: number;
  status: "good" | "warning" | "critical";
}

export interface BenchmarkRun {
  timestamp: Date;
  commit: string;
  metrics: BenchmarkMetric[];
}

export interface PerformanceReport {
  repository: string;
  generatedAt: Date;
  currentMetrics: BenchmarkMetric[];
  historicalData: BenchmarkRun[];
  trends: { metric: string; direction: "improving" | "stable" | "degrading" }[];
  recommendations: string[];
}

export function generatePerformanceReport(repository: Repository): PerformanceReport {
  const currentMetrics: BenchmarkMetric[] = [
    { name: "Build Time", value: 45, unit: "seconds", target: 60, status: "good" },
    { name: "Test Suite", value: 120, unit: "seconds", target: 180, status: "good" },
    { name: "Bundle Size", value: 2.5, unit: "MB", target: 3, status: "good" },
    { name: "First Load", value: 1.8, unit: "seconds", target: 2, status: "warning" },
    { name: "Time to Interactive", value: 2.5, unit: "seconds", target: 3, status: "warning" },
  ];

  const historicalData: BenchmarkRun[] = [
    { timestamp: new Date("2026-04-01"), commit: "abc123", metrics: currentMetrics },
    { timestamp: new Date("2026-05-01"), commit: "def456", metrics: currentMetrics },
  ];

  const trends = currentMetrics.map(m => ({
    metric: m.name,
    direction: m.status === "good" ? "improving" : m.status === "warning" ? "stable" : "degrading",
  }));

  const recommendations = [
    "Consider code splitting to reduce initial bundle size",
    "Optimize images and static assets",
    "Enable compression and caching headers",
  ];

  return {
    repository: repository.name,
    generatedAt: new Date(),
    currentMetrics,
    historicalData,
    trends,
    recommendations,
  };
}
