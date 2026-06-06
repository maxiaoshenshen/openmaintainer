/**
 * OSS License Advisor
 * Helps maintainers choose and manage open source licenses
 */
export interface LicenseInfo {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  conditions: string[];
  limitations: string[];
  compatibility: string[];
  category: "permissive" | "weak-copyleft" | "copyleft" | "proprietary";
}

export interface LicenseRecommendation {
  useCase: string;
  recommendedLicense: string;
  reason: string;
  alternatives: string[];
}

const licenses: Record<string, LicenseInfo> = {
  mit: {
    id: "MIT",
    name: "MIT License",
    description: "A permissive license that allows users to do almost anything with your code",
    permissions: ["Commercial use", "Distribution", "Modification", "Private use", "Sublicense"],
    conditions: ["Include copyright notice"],
    limitations: ["No liability", "No warranty"],
    compatibility: ["GPL", "Apache", "BSD"],
    category: "permissive",
  },
  apache: {
    id: "Apache-2.0",
    name: "Apache License 2.0",
    description: "A permissive license that requires attribution and explicit patent grants",
    permissions: ["Commercial use", "Distribution", "Modification", "Patent use", "Private use"],
    conditions: ["Include copyright notice", "Include NOTICE file if applicable", "Document changes"],
    limitations: ["No liability", "No warranty"],
    compatibility: ["GPL", "MIT", "BSD"],
    category: "permissive",
  },
  gpl: {
    id: "GPL-3.0",
    name: "GNU General Public License v3.0",
    description: "A strong copyleft license that requires derivative works to be open source",
    permissions: ["Commercial use", "Distribution", "Modification", "Patent use", "Private use"],
    conditions: ["Source code must be available", "Include copyright notice", "Document changes", "State significant changes"],
    limitations: ["No additional permissions", "GPL linking restriction"],
    compatibility: ["GPL"],
    category: "copyleft",
  },
  lgpl: {
    id: "LGPL-3.0",
    name: "GNU Lesser General Public License v3.0",
    description: "A weak copyleft license for libraries that allows proprietary linking",
    permissions: ["Commercial use", "Distribution", "Modification", "Patent use", "Private use"],
    conditions: ["Include copyright notice", "State changes", "Provide installation instructions"],
    limitations: ["Weaker linking permission"],
    compatibility: ["GPL", "LGPL"],
    category: "weak-copyleft",
  },
  bsd: {
    id: "BSD-3-Clause",
    name: "BSD 3-Clause License",
    description: "A permissive license similar to MIT with an anti-endorsement clause",
    permissions: ["Commercial use", "Distribution", "Modification", "Private use"],
    conditions: ["Include copyright notice", "Redistributions must preserve disclaimer"],
    limitations: ["No endorsement using creator names"],
    compatibility: ["GPL", "MIT", "Apache"],
    category: "permissive",
  },
};

export function getLicenseInfo(licenseId: string): LicenseInfo | null {
  return licenses[licenseId.toLowerCase()] || null;
}

export function recommendLicense(useCase: string): LicenseRecommendation {
  const lower = useCase.toLowerCase();
  
  if (lower.includes("library") || lower.includes("framework") || lower.includes("component")) {
    return {
      useCase: "Library/Framework",
      recommendedLicense: "MIT",
      reason: "Maximizes adoption while protecting your contribution",
      alternatives: ["Apache-2.0", "BSD-3-Clause"],
    };
  }
  
  if (lower.includes("application") || lower.includes("app")) {
    return {
      useCase: "Application",
      recommendedLicense: "Apache-2.0",
      reason: "Provides patent protection and explicit grants",
      alternatives: ["MIT", "GPL-3.0"],
    };
  }
  
  if (lower.includes("copyleft") || lower.includes("viral") || lower.includes("open")) {
    return {
      useCase: "Copyleft/Community",
      recommendedLicense: "GPL-3.0",
      reason: "Ensures derivative works remain open source",
      alternatives: ["LGPL-3.0"],
    };
  }
  
  return {
    useCase: "General",
    recommendedLicense: "MIT",
    reason: "Simple, permissive, and widely understood",
    alternatives: ["Apache-2.0", "BSD-3-Clause"],
  };
}
