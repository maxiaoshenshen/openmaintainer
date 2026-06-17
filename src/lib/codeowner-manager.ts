/**
 * Codeowner Manager
 * Manages CODEOWNERS file and ownership assignments
 */

export interface CodeOwner {
  pattern: string;
  owners: string[];
  description?: string;
}

export interface OwnershipRule {
  filePattern: string;
  requiredReviewers: number;
  notificationLevel: 'none' | 'assigned' | 'commented' | 'subscribed';
  autoAssign: boolean;
  fallbackOwners?: string[];
}

export interface CodeOwnerSuggestion {
  contributor: string;
  filePatterns: string[];
  reason: string;
  expertiseScore: number;
  recentActivity: number;
}

/**
 * Parse CODEOWNERS file
 */
export function parseCodeowners(content: string): CodeOwner[] {
  const lines = content.split('\n');
  const owners: CodeOwner[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    // Parse pattern and owners
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      const pattern = parts[0];
      const ownerList = parts.slice(1).map(o => o.replace(/^@/, ''));
      
      owners.push({ pattern, owners: ownerList });
    }
  }
  
  return owners;
}

/**
 * Generate CODEOWNERS file content
 */
export function generateCodeowners(rules: OwnershipRule[], defaultOwners: string[]): string {
  let content = `# CODEOWNERS - Managed by OpenMaintainer
# Last updated: ${new Date().toISOString().split('T')[0]}

`;
  
  // Add default owners
  if (defaultOwners.length > 0) {
    content += `# Default owners for everything\n`;
    content += `* ${defaultOwners.map(o => `@${o}`).join(' ')}\n\n`;
  }
  
  // Add specific rules
  for (const rule of rules) {
    content += `# ${rule.filePattern}\n`;
    content += `${rule.filePattern} ${rule.fallbackOwners?.map(o => `@${o}`).join(' ') || ''}\n\n`;
  }
  
  return content;
}

/**
 * Suggest codeowners based on contributor activity
 */
export function suggestCodeowners(
  patterns: string[],
  contributors: Array<{
    username: string;
    contributions: number;
    filesModified?: string[];
  }>
): CodeOwnerSuggestion[] {
  const suggestions: CodeOwnerSuggestion[] = [];
  
  for (const contributor of contributors) {
    const matchedPatterns: string[] = [];
    let expertiseScore = 0;
    let recentActivity = 0;
    
    // Check if contributor has modified files matching patterns
    for (const pattern of patterns) {
      if (contributor.filesModified?.some(f => matchesPattern(f, pattern))) {
        matchedPatterns.push(pattern);
        expertiseScore += 20;
        recentActivity += 10;
      }
    }
    
    // Base score on contribution count
    expertiseScore += Math.min(contributor.contributions / 10, 50);
    
    if (matchedPatterns.length > 0) {
      suggestions.push({
        contributor: contributor.username,
        filePatterns: matchedPatterns,
        reason: `Active contributor with ${contributor.contributions} contributions`,
        expertiseScore,
        recentActivity,
      });
    }
  }
  
  return suggestions.sort((a, b) => b.expertiseScore - a.expertiseScore);
}

/**
 * Match file path against pattern
 */
function matchesPattern(file: string, pattern: string): boolean {
  // Convert glob pattern to regex
  const regex = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.')
    .replace(/\*\*/g, '.*');
  
  return new RegExp(`^${regex}`).test(file);
}

/**
 * Get ownership for a file
 */
export function getOwnership(filePath: string, owners: CodeOwner[]): string[] {
  for (const owner of owners) {
    if (matchesPattern(filePath, owner.pattern)) {
      return owner.owners;
    }
  }
  return [];
}

/**
 * Validate CODEOWNERS file
 */
export function validateCodeowners(
  content: string,
  validUsers: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const owners = parseCodeowners(content);
  
  for (const owner of owners) {
    for (const o of owner.owners) {
      if (!validUsers.includes(o)) {
        errors.push(`Unknown user @${o} in rule for ${owner.pattern}`);
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Get ownership statistics
 */
export function getOwnershipStats(owners: CodeOwner[]): {
  totalRules: number;
  ownerCount: number;
  mostOwnedPattern: string;
  leastOwnedPattern: string;
} {
  const ownerCounts = new Map<string, number>();
  
  for (const rule of owners) {
    for (const owner of rule.owners) {
      ownerCounts.set(owner, (ownerCounts.get(owner) || 0) + 1);
    }
  }
  
  let mostOwned = owners[0]?.pattern || '';
  let leastOwned = owners[0]?.pattern || '';
  let maxCount = 0;
  let minCount = Infinity;
  
  for (const [pattern, count] of ownerCounts) {
    if (count > maxCount) {
      maxCount = count;
      mostOwned = pattern;
    }
    if (count < minCount) {
      minCount = count;
      leastOwned = pattern;
    }
  }
  
  return {
    totalRules: owners.length,
    ownerCount: ownerCounts.size,
    mostOwnedPattern: mostOwned,
    leastOwnedPattern: leastOwned,
  };
}
