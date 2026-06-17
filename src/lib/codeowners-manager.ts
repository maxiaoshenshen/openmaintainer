export interface CodeOwnerRule {
  pattern: string;
  owners: string[];
  requiredReviewers?: number;
  description?: string;
}

export interface CodeOwnerEntry {
  path: string;
  owners: string[];
  isActive: boolean;
}

export interface CodeOwnerValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function parseCodeowners(content: string): CodeOwnerEntry[] {
  const entries: CodeOwnerEntry[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 2) {
      const pattern = parts[0];
      const owners = parts.slice(1).filter(o => !o.startsWith('#'));
      
      entries.push({
        path: pattern,
        owners,
        isActive: true
      });
    }
  }
  
  return entries;
}

export function generateCodeowners(rules: CodeOwnerRule[]): string {
  const header = `# CODEOWNERS - Auto-generated\n# Generated at ${new Date().toISOString()}\n\n`;
  const entries = rules.map(rule => {
    const comment = rule.description ? ` # ${rule.description}` : '';
    return `${rule.pattern} ${rule.owners.join(' ')}${comment}`;
  }).join('\n');
  
  return header + entries;
}

export function validateCodeowners(entries: CodeOwnerEntry[]): CodeOwnerValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const hasRootRule = entries.some(e => e.path === '/' || e.path === '*');
  if (!hasRootRule) {
    warnings.push('No root-level ownership rule found. Consider adding a default rule.');
  }
  
  const seenPaths = new Set<string>();
  for (const entry of entries) {
    if (seenPaths.has(entry.path)) {
      errors.push(`Duplicate path pattern: ${entry.path}`);
    }
    seenPaths.add(entry.path);
    
    if (entry.owners.length === 0) {
      errors.push(`Path ${entry.path} has no owners assigned.`);
    }
    
    for (const owner of entry.owners) {
      if (!owner.includes('/') && !owner.includes('@')) {
        warnings.push(`Owner ${owner} might be a team. Consider using @team format.`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function findOwners(entries: CodeOwnerEntry[], filePath: string): string[] {
  const owners: string[] = [];
  
  for (const entry of entries) {
    if (matchPattern(entry.path, filePath)) {
      owners.push(...entry.owners);
    }
  }
  
  return [...new Set(owners)];
}

function matchPattern(pattern: string, filePath: string): boolean {
  if (pattern === '*') return true;
  if (pattern === '/') return filePath.startsWith('/');
  
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  
  try {
    return new RegExp(`^${regexPattern}`).test(filePath);
  } catch {
    return false;
  }
}

export function suggestOwnership(
  filePath: string,
  recentChanges: { author: string; path: string }[]
): string[] {
  const contributors = new Map<string, number>();
  
  for (const change of recentChanges) {
    if (matchPattern(filePath, change.path)) {
      contributors.set(change.author, (contributors.get(change.author) || 0) + 1);
    }
  }
  
  return [...contributors.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([author]) => author);
}

export function detectUnownedPaths(
  entries: CodeOwnerEntry[],
  allPaths: string[]
): string[] {
  const unowned: string[] = [];
  
  for (const path of allPaths) {
    const owners = findOwners(entries, path);
    if (owners.length === 0) {
      unowned.push(path);
    }
  }
  
  return unowned;
}
