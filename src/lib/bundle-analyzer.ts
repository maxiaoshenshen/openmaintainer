/**
 * Bundle Analyzer - Analyze and optimize bundle size
 */

export interface BundleStats {
  totalSize: number;
  gzippedSize: number;
  files: BundleFile[];
  modules: ModuleInfo[];
  largestModules: ModuleInfo[];
}

export interface BundleFile {
  name: string;
  size: number;
  gzippedSize: number;
  type: 'js' | 'css' | 'html' | 'asset';
}

export interface ModuleInfo {
  name: string;
  size: number;
  gzippedSize: number;
  isDuplicate: boolean;
  duplicateCount: number;
  reasons: string[];
}

export interface BundleTrend {
  date: Date;
  totalSize: number;
  gzippedSize: number;
  moduleCount: number;
}

export interface OptimizationSuggestion {
  module: string;
  currentSize: number;
  suggestedAction: string;
  potentialSavings: number;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Analyze bundle composition
 */
export function analyzeBundle(files: BundleFile[]): BundleStats {
  const modules: ModuleInfo[] = [];
  let totalSize = 0;
  let gzippedSize = 0;

  files.forEach(file => {
    totalSize += file.size;
    gzippedSize += file.gzippedSize;
  });

  const largestModules = modules
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);

  return {
    totalSize,
    gzippedSize,
    files,
    modules,
    largestModules
  };
}

/**
 * Find duplicate modules
 */
export function findDuplicateModules(modules: ModuleInfo[]): ModuleInfo[] {
  return modules
    .filter(m => m.isDuplicate)
    .sort((a, b) => b.duplicateCount - a.duplicateCount);
}

/**
 * Calculate size category
 */
export function getSizeCategory(bytes: number): 'tiny' | 'small' | 'medium' | 'large' | 'huge' {
  const kb = bytes / 1024;
  if (kb < 10) return 'tiny';
  if (kb < 50) return 'small';
  if (kb < 150) return 'medium';
  if (kb < 500) return 'large';
  return 'huge';
}

/**
 * Get optimization suggestions
 */
export function getOptimizationSuggestions(stats: BundleStats): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];

  stats.largestModules.forEach(mod => {
    if (mod.size > 100 * 1024) {
      suggestions.push({
        module: mod.name,
        currentSize: mod.size,
        suggestedAction: 'Consider dynamic imports or tree-shaking',
        potentialSavings: Math.round(mod.size * 0.3),
        priority: 'high'
      });
    }
  });

  const duplicates = findDuplicateModules(stats.modules);
  duplicates.forEach(dup => {
    suggestions.push({
      module: dup.name,
      currentSize: dup.size * dup.duplicateCount,
      suggestedAction: 'Deduplicate by ensuring single version in package.json',
      potentialSavings: dup.size * (dup.duplicateCount - 1),
      priority: 'medium'
    });
  });

  return suggestions.sort((a, b) => b.potentialSavings - a.potentialSavings);
}

/**
 * Generate bundle health score
 */
export function getBundleHealthScore(stats: BundleStats): {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  metrics: { name: string; value: number; target: number; passed: boolean }[];
} {
  const metrics = [
    {
      name: 'Total Size',
      value: stats.totalSize,
      target: 500 * 1024,
      passed: stats.totalSize < 500 * 1024
    },
    {
      name: 'Gzipped Size',
      value: stats.gzippedSize,
      target: 150 * 1024,
      passed: stats.gzippedSize < 150 * 1024
    },
    {
      name: 'Module Count',
      value: stats.modules.length,
      target: 200,
      passed: stats.modules.length < 200
    },
    {
      name: 'Duplicate Count',
      value: findDuplicateModules(stats.modules).length,
      target: 0,
      passed: findDuplicateModules(stats.modules).length === 0
    }
  ];

  const passedCount = metrics.filter(m => m.passed).length;
  const score = Math.round((passedCount / metrics.length) * 100);
  
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  if (score >= 90) grade = 'A';
  else if (score >= 75) grade = 'B';
  else if (score >= 60) grade = 'C';
  else if (score >= 40) grade = 'D';
  else grade = 'F';

  return { score, grade, metrics };
}

/**
 * Track bundle size over time
 */
export function trackBundleSize(trends: BundleTrend[]): {
  change: number;
  changePercent: number;
  trend: 'improving' | 'stable' | 'growing';
} {
  if (trends.length < 2) {
    return { change: 0, changePercent: 0, trend: 'stable' };
  }

  const oldest = trends[0];
  const newest = trends[trends.length - 1];
  const change = newest.totalSize - oldest.totalSize;
  const changePercent = (change / oldest.totalSize) * 100;

  return {
    change,
    changePercent,
    trend: change < -10240 ? 'improving' : change > 10240 ? 'growing' : 'stable'
  };
}
