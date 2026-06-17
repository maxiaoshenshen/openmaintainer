export interface BadgeStyle {
  label: string;
  message: string;
  color: string;
  labelColor?: string;
  style: 'flat' | 'flat-square' | 'for-the-badge' | 'plastic';
}

export interface BadgeConfig {
  label: string;
  value: string;
  color?: string;
  labelColor?: string;
  style?: BadgeStyle['style'];
  logo?: string;
  link?: string;
}

export interface GeneratedBadge {
  url: string;
  markdown: string;
  html: string;
  config: BadgeConfig;
}

export function createBadge(config: BadgeConfig): GeneratedBadge {
  const params = new URLSearchParams({
    label: config.label,
    message: config.value,
    color: config.color || 'informational',
    style: config.style || 'flat',
    ...(config.labelColor && { labelColor: config.labelColor }),
    ...(config.logo && { logo: config.logo }),
    ...(config.link && { link: config.link })
  });

  const url = `https://img.shields.io/badge/${params.toString()}`;
  
  return {
    url: decodeURIComponent(url),
    markdown: `![${config.label}](${url})`,
    html: `<img src="${url}" alt="${config.label}">`,
    config
  };
}

export function generateContribCountBadge(count: number): GeneratedBadge {
  return createBadge({
    label: 'Contributors',
    value: count.toString(),
    color: 'success'
  });
}

export function generatePRMergeRateBadge(rate: number): GeneratedBadge {
  const color = rate >= 80 ? 'success' : rate >= 60 ? 'yellow' : 'red';
  return createBadge({
    label: 'PR Merge Rate',
    value: `${rate}%`,
    color
  });
}

export function generateIssueResponseBadge(hours: number): GeneratedBadge {
  const color = hours <= 24 ? 'success' : hours <= 72 ? 'yellow' : 'red';
  return createBadge({
    label: 'Issue Response',
    value: `${hours}h`,
    color
  });
}

export function generateTestCoverageBadge(coverage: number): GeneratedBadge {
  const color = coverage >= 80 ? 'success' : coverage >= 60 ? 'yellow' : 'red';
  return createBadge({
    label: 'Coverage',
    value: `${coverage}%`,
    color,
    style: 'flat-square'
  });
}

export function generateBuildStatusBadge(status: 'passing' | 'failing' | 'unknown'): GeneratedBadge {
  const config: BadgeConfig = {
    label: 'Build',
    value: status === 'passing' ? 'Passing' : status === 'failing' ? 'Failing' : 'Unknown',
    color: status === 'passing' ? 'success' : status === 'failing' ? 'critical' : 'lightgrey'
  };
  return createBadge(config);
}

export function generateLicenseBadge(license: string): GeneratedBadge {
  return createBadge({
    label: 'License',
    value: license,
    color: 'MIT' === license ? 'green' : 'blue'
  });
}

export function generateStarsBadge(stars: number): GeneratedBadge {
  return createBadge({
    label: 'Stars',
    value: stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : stars.toString(),
    color: 'yellow'
  });
}

export function generateDownloadsBadge(downloads: number): GeneratedBadge {
  return createBadge({
    label: 'Downloads',
    value: downloads >= 1000000 ? `${(downloads / 1000000).toFixed(1)}M` 
      : downloads >= 1000 ? `${(downloads / 1000).toFixed(1)}k` 
      : downloads.toString(),
    color: 'informational'
  });
}

export function generateRepoHealthBadge(score: number): GeneratedBadge {
  const color = score >= 80 ? 'success' : score >= 60 ? 'yellow' : 'red';
  return createBadge({
    label: 'Health',
    value: score.toString(),
    color,
    style: 'for-the-badge'
  });
}

export function generateAllBadges(data: {
  contributors: number;
  prMergeRate: number;
  issueResponseHours: number;
  testCoverage: number;
  buildStatus: 'passing' | 'failing' | 'unknown';
  license: string;
  stars: number;
  downloads: number;
  healthScore: number;
}): GeneratedBadge[] {
  return [
    generateContribCountBadge(data.contributors),
    generatePRMergeRateBadge(data.prMergeRate),
    generateIssueResponseBadge(data.issueResponseHours),
    generateTestCoverageBadge(data.testCoverage),
    generateBuildStatusBadge(data.buildStatus),
    generateLicenseBadge(data.license),
    generateStarsBadge(data.stars),
    generateDownloadsBadge(data.downloads),
    generateRepoHealthBadge(data.healthScore)
  ];
}
