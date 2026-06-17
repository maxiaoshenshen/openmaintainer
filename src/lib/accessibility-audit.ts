/**
 * Accessibility Audit - WCAG compliance checking for OSS projects
 */

export type WcagLevel = 'A' | 'AA' | 'AAA';

export interface AccessibilityIssue {
  id: string;
  severity: 'critical' | 'major' | 'minor';
  wcagLevel: WcagLevel;
  criterion: string;
  description: string;
  element?: string;
  suggestion: string;
}

export interface A11yReport {
  score: number;
  totalChecks: number;
  passedChecks: number;
  issues: AccessibilityIssue[];
  summary: Record<string, number>;
}

export interface ColorContrast {
  foreground: string;
  background: string;
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
  passesAALarge: boolean;
}

/**
 * Calculate color contrast ratio (WCAG 2.1)
 */
export function calculateContrastRatio(hex1: string, hex2: string): number {
  const getLuminance = (hex: string): number => {
    const rgb = hexToRgb(hex);
    const [r, g, b] = rgb.map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRgb(hex: string): number[] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

/**
 * Check color contrast compliance
 */
export function checkColorContrast(foreground: string, background: string): ColorContrast {
  const ratio = calculateContrastRatio(foreground, background);
  return {
    foreground,
    background,
    ratio: Math.round(ratio * 100) / 100,
    passesAA: ratio >= 4.5,
    passesAAA: ratio >= 7,
    passesAALarge: ratio >= 3
  };
}

/**
 * Check image alt text
 */
export function checkImageAlt(element: { hasAlt: boolean; altText?: string; isDecorative?: boolean }): AccessibilityIssue | null {
  if (!element.hasAlt) {
    return {
      id: 'img-alt-missing',
      severity: 'critical',
      wcagLevel: 'A',
      criterion: '1.1.1 Non-text Content',
      description: 'Image is missing alt attribute',
      element: 'img',
      suggestion: 'Add alt attribute describing the image content'
    };
  }

  if (element.altText === '' && !element.isDecorative) {
    return {
      id: 'img-alt-empty',
      severity: 'major',
      wcagLevel: 'A',
      criterion: '1.1.1 Non-text Content',
      description: 'Image has empty alt text but is not marked as decorative',
      element: 'img',
      suggestion: 'Either provide descriptive alt text or mark as decorative (alt="")'
    };
  }

  return null;
}

/**
 * Check heading hierarchy
 */
export function checkHeadingHierarchy(headings: number[]): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  let previousLevel = 0;

  headings.forEach((level, index) => {
    if (level > previousLevel + 1 && previousLevel !== 0) {
      issues.push({
        id: 'heading-order',
        severity: 'minor',
        wcagLevel: 'AA',
        criterion: '1.3.1 Info and Relationships',
        description: `Heading level jumps from h${previousLevel} to h${level}`,
        element: `h${level}`,
        suggestion: `Use h${previousLevel + 1} instead or restructure headings`
      });
    }
    previousLevel = level;
  });

  return issues;
}

/**
 * Check form labels
 */
export function checkFormLabels(inputs: Array<{ id: string; hasLabel: boolean; labelText?: string }>): AccessibilityIssue[] {
  return inputs
    .filter(input => !input.hasLabel)
    .map(input => ({
      id: 'form-label-missing',
      severity: 'critical',
      wcagLevel: 'A',
      criterion: '1.3.1 Info and Relationships',
      description: `Input "${input.id}" is missing associated label`,
      element: `input#${input.id}`,
      suggestion: 'Add label element with for attribute matching input id'
    }));
}

/**
 * Generate accessibility audit report
 */
export function generateA11yReport(checks: {
  images: Array<{ hasAlt: boolean; altText?: string }>;
  headings: number[];
  inputs: Array<{ id: string; hasLabel: boolean }>;
  colorPairs?: Array<{ foreground: string; background: string }>;
}): A11yReport {
  const issues: AccessibilityIssue[] = [];

  checks.images.forEach(img => {
    const issue = checkImageAlt(img);
    if (issue) issues.push(issue);
  });

  issues.push(...checkHeadingHierarchy(checks.headings));
  issues.push(...checkFormLabels(checks.inputs));

  if (checks.colorPairs) {
    checks.colorPairs.forEach(pair => {
      const contrast = checkColorContrast(pair.foreground, pair.background);
      if (!contrast.passesAA) {
        issues.push({
          id: 'color-contrast',
          severity: 'major',
          wcagLevel: 'AA',
          criterion: '1.4.3 Contrast (Minimum)',
          description: `Color contrast ratio ${contrast.ratio}:1 does not meet AA (4.5:1)`,
          suggestion: 'Increase contrast between foreground and background colors'
        });
      }
    });
  }

  const summary = {
    critical: issues.filter(i => i.severity === 'critical').length,
    major: issues.filter(i => i.severity === 'major').length,
    minor: issues.filter(i => i.severity === 'minor').length
  };

  const totalChecks = checks.images.length + checks.headings.length + checks.inputs.length + (checks.colorPairs?.length || 0);
  const passedChecks = totalChecks - issues.length;
  const score = Math.round((passedChecks / totalChecks) * 100);

  return { score, totalChecks, passedChecks, issues, summary };
}
