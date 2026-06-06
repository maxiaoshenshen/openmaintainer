/**
 * Contributor Value Evaluator
 * Multi-dimensional assessment of contributor impact and value
 */
export interface ContributorProfile {
  username: string;
  joinDate: Date;
  totalContributions: number;
  prsMerged: number;
  issuesClosed: number;
  reviewsGiven: number;
  languagesUsed: string[];
  responseRate: number; // 0-1
  averageReviewTime: number; // hours
}

export interface ValueMetrics {
  codeQuality: number; // 0-100
  communityEngagement: number; // 0-100
  responsiveness: number; // 0-100
  consistency: number; // 0-100
  collaboration: number; // 0-100
}

export interface ContributorValueScore {
  profile: ContributorProfile;
  metrics: ValueMetrics;
  overallScore: number; // 0-100
  tier: 'diamond' | 'platinum' | 'gold' | 'silver' | 'bronze' | 'newcomer';
  strengths: string[];
  growthAreas: string[];
  recentContributions: {
    type: 'pr' | 'issue' | 'review';
    title: string;
    date: Date;
    impact: 'high' | 'medium' | 'low';
  }[];
  badges: string[];
}

export function evaluateContributor(profile: ContributorProfile): ContributorValueScore {
  const metrics: ValueMetrics = {
    codeQuality: 0,
    communityEngagement: 0,
    responsiveness: 0,
    consistency: 0,
    collaboration: 0,
  };

  const strengths: string[] = [];
  const growthAreas: string[] = [];
  const badges: string[] = [];

  // Code Quality (based on PRs and their nature)
  const codeScore = Math.min(profile.prsMerged * 3, 60) + Math.min(profile.totalContributions * 0.5, 40);
  metrics.codeQuality = Math.round(codeScore);
  if (profile.prsMerged >= 50) strengths.push('Prolific code contributor');
  if (profile.languagesUsed.length >= 3) strengths.push('Multi-language expertise');
  if (profile.prsMerged < 5 && profile.totalContributions > 20) growthAreas.push('Focus on merging more PRs');

  // Community Engagement (issues and reviews)
  const engagementScore = Math.min(profile.issuesClosed * 2, 40) + Math.min(profile.reviewsGiven * 1.5, 60);
  metrics.communityEngagement = Math.round(engagementScore);
  if (profile.issuesClosed >= 20) strengths.push('Active issue resolver');
  if (profile.reviewsGiven >= 30) strengths.push('Active reviewer');
  if (profile.issuesClosed < 5) growthAreas.push('Consider helping with issue triage');

  // Responsiveness
  const responseScore = profile.responseRate * 100;
  metrics.responsiveness = Math.round(responseScore);
  if (profile.responseRate >= 0.8) strengths.push('Highly responsive');
  if (profile.responseRate < 0.5) growthAreas.push('Improve response rate to issues/PRs');

  // Consistency (based on tenure and activity)
  const tenureMonths = (Date.now() - profile.joinDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  const expectedContributions = tenureMonths * 5; // 5 contributions/month expected
  const consistencyRatio = expectedContributions > 0 ? Math.min(profile.totalContributions / expectedContributions, 1) : 0;
  metrics.consistency = Math.round(consistencyRatio * 100);
  if (consistencyRatio >= 0.8) strengths.push('Consistent contributor');
  if (tenureMonths >= 12 && consistencyRatio < 0.5) growthAreas.push('Consider more regular contributions');

  // Collaboration (average review time and interaction quality)
  const reviewQuality = profile.averageReviewTime > 0 
    ? Math.max(0, 100 - profile.averageReviewTime * 2)
    : 50;
  metrics.collaboration = Math.round(reviewQuality);
  if (profile.reviewsGiven >= 10 && profile.averageReviewTime <= 24) strengths.push('Quick, helpful reviews');
  if (profile.reviewsGiven > 0 && profile.averageReviewTime > 72) growthAreas.push('Try to review faster');

  // Calculate overall score
  const overallScore = Math.round(
    metrics.codeQuality * 0.3 +
    metrics.communityEngagement * 0.25 +
    metrics.responsiveness * 0.2 +
    metrics.consistency * 0.15 +
    metrics.collaboration * 0.1
  );

  // Determine tier
  let tier: ContributorValueScore['tier'];
  if (overallScore >= 90) tier = 'diamond';
  else if (overallScore >= 80) tier = 'platinum';
  else if (overallScore >= 70) tier = 'gold';
  else if (overallScore >= 50) tier = 'silver';
  else if (overallScore >= 30) tier = 'bronze';
  else tier = 'newcomer';

  // Assign badges
  if (profile.prsMerged >= 100) badges.push('🏆 Century Contributor');
  if (profile.prsMerged >= 50) badges.push('⭐ Elite Contributor');
  if (profile.issuesClosed >= 50) badges.push('🎯 Issue Hunter');
  if (profile.reviewsGiven >= 100) badges.push('👀 Review Master');
  if (profile.languagesUsed.length >= 5) badges.push('🛠️ Polyglot');
  if (profile.responseRate >= 0.95) badges.push('⚡ Lightning Fast');
  if (tier === 'diamond') badges.push('💎 Diamond Tier');

  return {
    profile,
    metrics,
    overallScore,
    tier,
    strengths,
    growthAreas,
    recentContributions: [], // Would be populated from real data
    badges,
  };
}

export function rankContributors(scores: ContributorValueScore[]): ContributorValueScore[] {
  return [...scores].sort((a, b) => b.overallScore - a.overallScore);
}

export function getTierColor(tier: ContributorValueScore['tier']): string {
  const colors: Record<ContributorValueScore['tier'], string> = {
    diamond: 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white',
    platinum: 'bg-gradient-to-r from-gray-300 to-gray-500 text-gray-900',
    gold: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900',
    silver: 'bg-gradient-to-r from-gray-200 to-gray-400 text-gray-700',
    bronze: 'bg-gradient-to-r from-orange-300 to-orange-500 text-orange-900',
    newcomer: 'bg-gray-100 text-gray-600',
  };
  return colors[tier];
}

export function suggestRecognition(contributor: ContributorValueScore): string {
  if (contributor.tier === 'diamond') {
    return `Consider featuring ${contributor.profile.username} in your README or as a project maintainer.`;
  }
  if (contributor.tier === 'platinum') {
    return `Consider inviting ${contributor.profile.username} as a co-maintainer or committer.`;
  }
  if (contributor.tier === 'gold') {
    return `Send a shoutout to ${contributor.profile.username} in your next release notes or social media.`;
  }
  if (contributor.tier === 'silver' || contributor.tier === 'bronze') {
    return `Send a thank-you message to ${contributor.profile.username} to encourage continued contributions.`;
  }
  return `Welcome ${contributor.profile.username} and guide them to their first contribution!`;
}
