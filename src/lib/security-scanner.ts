import type { Repository, SecurityAlert } from './types';

/**
 * Security Scanner - Scans repositories for security vulnerabilities
 */
export interface SecurityScanResult {
  repository: Repository;
  scanDate: Date;
  alerts: SecurityAlert[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export interface SecurityAlert {
  id: string;
  type: 'vulnerability' | 'weakness' | 'misconfiguration';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedFile?: string;
  cveId?: string;
  fixedInVersion?: string;
}

export function createSecurityScanner() {
  const scanRepository = (repo: Repository): SecurityScanResult => {
    const alerts: SecurityAlert[] = [];
    
    // Simulate security checks based on repo properties
    if (repo.language === 'JavaScript' || repo.language === 'TypeScript') {
      alerts.push({
        id: 'sec-001',
        type: 'vulnerability',
        severity: 'medium',
        title: 'Outdated dependencies detected',
        description: 'Some dependencies may have known vulnerabilities',
        fixedInVersion: 'latest'
      });
    }

    if (repo.openIssues > 50) {
      alerts.push({
        id: 'sec-002',
        type: 'weakness',
        severity: 'low',
        title: 'High issue volume',
        description: 'Consider triaging security-related issues'
      });
    }

    // Calculate risk level
    const maxSeverity = alerts.reduce((max, alert) => {
      const levels = { low: 1, medium: 2, high: 3, critical: 4 };
      return levels[alert.severity] > levels[max] ? alert.severity : max;
    }, 'low' as SecurityAlert['severity']);

    const recommendations = generateRecommendations(alerts);

    return {
      repository: repo,
      scanDate: new Date(),
      alerts,
      riskLevel: maxSeverity,
      recommendations
    };
  };

  const generateRecommendations = (alerts: SecurityAlert[]): string[] => {
    const recs: string[] = [];
    
    if (alerts.some(a => a.type === 'vulnerability')) {
      recs.push('Run npm audit or equivalent to identify vulnerable dependencies');
      recs.push('Enable automated security updates');
    }
    
    if (alerts.some(a => a.severity === 'critical' || a.severity === 'high')) {
      recs.push('Prioritize addressing critical and high severity issues');
      recs.push('Consider enabling GitHub Dependabot alerts');
    }
    
    recs.push('Implement a security policy (SECURITY.md)');
    recs.push('Enable 2FA for all collaborators with admin access');
    
    return recs;
  };

  const getSeverityColor = (severity: SecurityAlert['severity']): string => {
    const colors = {
      low: '#10b981',
      medium: '#f59e0b', 
      high: '#f97316',
      critical: '#ef4444'
    };
    return colors[severity];
  };

  return {
    scanRepository,
    getSeverityColor,
    SeverityLevels: ['low', 'medium', 'high', 'critical'] as const
  };
}
