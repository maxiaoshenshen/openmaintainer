/**
 * Badges Generator - Generate project status badges for README files
 */

export interface BadgeConfig {
  label: string;
  message: string;
  color: string;
  labelColor?: string;
  style?: 'flat' | 'flat-square' | 'plastic' | 'for-the-badge' | 'social';
  logo?: string;
  logoColor?: string;
}

export type BadgeType = 
  | 'build' 
  | 'tests' 
  | 'coverage' 
  | 'npm' 
  | 'downloads' 
  | 'stars'
  | 'license' 
  | 'node' 
  | 'dependencies'
  | 'maintenance'
  | 'security'
  | 'codeql'
  | 'docker'
  | 'deploy';

export interface GeneratedBadge {
  type: BadgeType;
  label: string;
  url: string;
  markdown: string;
  html: string;
}

/**
 * Generate a shield.io badge URL
 */
export function generateBadgeUrl(config: BadgeConfig): string {
  const base = 'https://img.shields.io/badge';
  const params = new URLSearchParams();
  
  params.set('label', config.label);
  params.set('message', config.message);
  params.set('color', config.color);
  
  if (config.labelColor) params.set('labelColor', config.labelColor);
  if (config.style) params.set('style', config.style);
  if (config.logo) params.set('logo', config.logo);
  if (config.logoColor) params.set('logoColor', config.logoColor);
  
  return `${base}/${encodeURIComponent(config.label)}-${encodeURIComponent(config.message)}-${config.color}.svg?${params.toString()}`;
}

/**
 * Generate markdown badge
 */
export function generateMarkdownBadge(config: BadgeConfig): string {
  const url = generateBadgeUrl(config);
  return `![${config.label}](${url})`;
}

/**
 * Generate HTML badge
 */
export function generateHtmlBadge(config: BadgeConfig): string {
  const url = generateBadgeUrl(config);
  return `<img src="${url}" alt="${config.label}" />`;
}

/**
 * Predefined badge colors
 */
export const colors = {
  success: '2ea44f',
  important: '0075c9',
  brightgreen: '4c1',
  green: '97CA00',
  yellow: 'fe7d37',
  orange: 'fe7d37',
  red: 'dc3545',
  blue: '007bff',
  purple: '8e44ad',
  pink: 'ff69b4',
  gray: '6c757d',
  lightgray: '9f9f9f',
};

/**
 * Generate standard badges for a project
 */
export function generateProjectBadges(config: {
  buildStatus?: 'passing' | 'failing' | 'unknown';
  testCoverage?: number;
  npmVersion?: string;
  downloads?: number;
  license?: string;
  nodeVersion?: string;
  dependencies?: 'up-to-date' | 'outdated' | 'vulnerable';
  maintenance?: 'active' | 'maintained' | 'no-maintenance';
}): GeneratedBadge[] {
  const badges: GeneratedBadge[] = [];
  
  // Build status
  if (config.buildStatus) {
    const statusConfig: BadgeConfig = {
      label: 'Build',
      message: config.buildStatus === 'passing' ? 'passing' : config.buildStatus === 'failing' ? 'failing' : 'unknown',
      color: config.buildStatus === 'passing' ? colors.success : config.buildStatus === 'failing' ? colors.red : colors.gray,
      style: 'flat-square',
      logo: 'github-actions',
    };
    badges.push({
      type: 'build',
      label: statusConfig.label,
      url: generateBadgeUrl(statusConfig),
      markdown: generateMarkdownBadge(statusConfig),
      html: generateHtmlBadge(statusConfig),
    });
  }
  
  // Test coverage
  if (config.testCoverage !== undefined) {
    const coverageColor = config.testCoverage >= 80 ? colors.brightgreen 
      : config.testCoverage >= 50 ? colors.yellow 
      : colors.red;
    
    badges.push({
      type: 'coverage',
      label: 'Coverage',
      url: generateBadgeUrl({
        label: 'coverage',
        message: `${config.testCoverage}%`,
        color: coverageColor,
        style: 'flat-square',
      }),
      markdown: generateMarkdownBadge({
        label: 'coverage',
        message: `${config.testCoverage}%`,
        color: coverageColor,
        style: 'flat-square',
      }),
      html: generateHtmlBadge({
        label: 'coverage',
        message: `${config.testCoverage}%`,
        color: coverageColor,
        style: 'flat-square',
      }),
    });
  }
  
  // NPM version
  if (config.npmVersion) {
    badges.push({
      type: 'npm',
      label: 'npm',
      url: generateBadgeUrl({
        label: 'npm',
        message: config.npmVersion,
        color: colors.red,
        style: 'flat-square',
        logo: 'npm',
      }),
      markdown: generateMarkdownBadge({
        label: 'npm',
        message: config.npmVersion,
        color: colors.red,
        style: 'flat-square',
        logo: 'npm',
      }),
      html: generateHtmlBadge({
        label: 'npm',
        message: config.npmVersion,
        color: colors.red,
        style: 'flat-square',
        logo: 'npm',
      }),
    });
  }
  
  // Downloads
  if (config.downloads) {
    const downloadCount = formatNumber(config.downloads);
    badges.push({
      type: 'downloads',
      label: 'Downloads',
      url: generateBadgeUrl({
        label: 'Downloads',
        message: downloadCount,
        color: colors.blue,
        style: 'flat-square',
      }),
      markdown: generateMarkdownBadge({
        label: 'Downloads',
        message: downloadCount,
        color: colors.blue,
        style: 'flat-square',
      }),
      html: generateHtmlBadge({
        label: 'Downloads',
        message: downloadCount,
        color: colors.blue,
        style: 'flat-square',
      }),
    });
  }
  
  // License
  if (config.license) {
    badges.push({
      type: 'license',
      label: 'License',
      message: config.license,
      url: generateBadgeUrl({
        label: 'License',
        message: config.license,
        color: colors.lightgray,
        style: 'flat-square',
      }),
      markdown: generateMarkdownBadge({
        label: 'License',
        message: config.license,
        color: colors.lightgray,
        style: 'flat-square',
      }),
      html: generateHtmlBadge({
        label: 'License',
        message: config.license,
        color: colors.lightgray,
        style: 'flat-square',
      }),
    } as GeneratedBadge);
  }
  
  // Node version
  if (config.nodeVersion) {
    badges.push({
      type: 'node',
      label: 'Node',
      url: generateBadgeUrl({
        label: 'Node',
        message: config.nodeVersion,
        color: colors.green,
        style: 'flat-square',
        logo: 'node.js',
      }),
      markdown: generateMarkdownBadge({
        label: 'Node',
        message: config.nodeVersion,
        color: colors.green,
        style: 'flat-square',
        logo: 'node.js',
      }),
      html: generateHtmlBadge({
        label: 'Node',
        message: config.nodeVersion,
        color: colors.green,
        style: 'flat-square',
        logo: 'node.js',
      }),
    });
  }
  
  // Dependencies
  if (config.dependencies) {
    const depConfig: Record<string, { color: string; message: string }> = {
      'up-to-date': { color: colors.success, message: 'up to date' },
      'outdated': { color: colors.yellow, message: 'outdated' },
      'vulnerable': { color: colors.red, message: 'vulnerabilities' },
    };
    
    badges.push({
      type: 'dependencies',
      label: 'Dependencies',
      url: generateBadgeUrl({
        label: 'Dependabot',
        message: depConfig[config.dependencies].message,
        color: depConfig[config.dependencies].color,
        style: 'flat-square',
      }),
      markdown: generateMarkdownBadge({
        label: 'Dependabot',
        message: depConfig[config.dependencies].message,
        color: depConfig[config.dependencies].color,
        style: 'flat-square',
      }),
      html: generateHtmlBadge({
        label: 'Dependabot',
        message: depConfig[config.dependencies].message,
        color: depConfig[config.dependencies].color,
        style: 'flat-square',
      }),
    });
  }
  
  return badges;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}

/**
 * Generate markdown section with all badges
 */
export function generateBadgesSection(badges: GeneratedBadge[], title = '## Badges'): string {
  const badgeMarkdown = badges.map(b => b.markdown).join(' ');
  return `${title}\n\n${badgeMarkdown}\n`;
}
