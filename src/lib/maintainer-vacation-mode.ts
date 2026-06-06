/**
 * Maintainer Vacation Mode
 * Handles temporary absence and maintains community expectations
 */
export interface VacationSettings {
  enabled: boolean;
  startDate: Date;
  endDate: Date;
  autoRespondIssues: boolean;
  autoRespondPRs: boolean;
  messageTemplate: string;
  delegateTo: string[];
  enableGitHubAwayStatus: boolean;
  notifyCommunity: boolean;
  announcementChannel: 'issues' | 'discussions' | 'both';
}

export interface VacationAnnouncement {
  title: string;
  body: string;
  includes: {
    duration: boolean;
    delegateInfo: boolean;
    emergencyContact: boolean;
    expectedResponseDelay: boolean;
  };
}

export const DEFAULT_VACATION_MESSAGE = `## 👋 I'm temporarily away

Thank you for your contribution! I'm currently on vacation and will be back on {{returnDate}}.

**What this means for you:**
- Issues and PRs will receive an initial acknowledgment
- Full responses will be delayed until my return
- For urgent matters, please contact: {{delegateNames}}

I'll review and respond to everything as soon as possible after {{returnDate}}.

Thank you for your patience and understanding! 🙏`;

export interface DelegationSetup {
  delegate: {
    githubUsername: string;
    responsibilities: string[];
    maxCapacity: 'low' | 'medium' | 'high';
  };
  permissions: {
    canMerge: boolean;
    canClose: boolean;
    canLabel: boolean;
    canComment: boolean;
  };
  communication: {
    shouldNotifyOnNew: boolean;
    shouldNotifyOnUrgent: boolean;
    notificationChannel: string;
  };
}

export function createVacationSettings(
  startDate: Date,
  endDate: Date,
  options?: Partial<VacationSettings>
): VacationSettings {
  return {
    enabled: false,
    startDate,
    endDate,
    autoRespondIssues: true,
    autoRespondPRs: true,
    messageTemplate: DEFAULT_VACATION_MESSAGE.replace('{{returnDate}}', endDate.toLocaleDateString()),
    delegateTo: [],
    enableGitHubAwayStatus: true,
    notifyCommunity: false,
    announcementChannel: 'both',
    ...options,
  };
}

export function generateVacationMessage(settings: VacationSettings): string {
  let message = settings.messageTemplate;
  message = message.replace('{{returnDate}}', settings.endDate.toLocaleDateString());
  message = message.replace('{{delegateNames}}', settings.delegateTo.join(', ') || 'project co-maintainers');
  return message;
}

export function createVacationAnnouncement(settings: VacationSettings): VacationAnnouncement {
  const delegateNames = settings.delegateTo.join(' and ');
  
  return {
    title: '🔔 Maintainer Vacation Notice',
    body: `Hello wonderful contributors!

I'll be taking a break from **${settings.startDate.toLocaleDateString()}** to **${settings.endDate.toLocaleDateString()}**.

### What to expect:
- ⏳ Response times will be delayed during this period
- 🆘 For urgent issues, please reach out to ${delegateNames || 'co-maintainers'}
- ✅ All issues and PRs will be reviewed upon my return

### In the meantime:
- Feel free to continue submitting contributions
- Use "help wanted" labeled issues for guidance
- Check existing discussions for community help

Thank you for your understanding! See you soon. 🙏`,
    includes: {
      duration: true,
      delegateInfo: settings.delegateTo.length > 0,
      emergencyContact: true,
      expectedResponseDelay: true,
    },
  };
}

export function generateDelegationPlan(
  delegates: DelegationSetup[],
  settings: Pick<VacationSettings, 'startDate' | 'endDate'>
): {
  summary: string;
  assignments: Record<string, string[]>;
  coverage: { start: Date; end: Date; delegate: string }[];
} {
  // Create coverage schedule
  const coverage: { start: Date; end: Date; delegate: string }[] = [];
  let currentDate = new Date(settings.startDate);
  
  // Simple round-robin assignment
  const sortedDelegates = [...delegates].sort((a, b) => {
    const capacity = { low: 1, medium: 2, high: 3 };
    return capacity[a.delegate.maxCapacity] - capacity[b.delegate.maxCapacity];
  });
  
  let delegateIndex = 0;
  while (currentDate < settings.endDate) {
    const delegate = sortedDelegates[delegateIndex % sortedDelegates.length];
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 7); // Weekly rotation
    
    coverage.push({
      start: new Date(currentDate),
      end: nextDate > settings.endDate ? settings.endDate : nextDate,
      delegate: delegate.delegate.githubUsername,
    });
    
    currentDate = nextDate;
    delegateIndex++;
  }
  
  // Create assignments map
  const assignments: Record<string, string[]> = {};
  for (const d of delegates) {
    assignments[d.delegate.githubUsername] = d.delegate.responsibilities;
  }
  
  const summary = `Delegation plan created with ${delegates.length} delegate(s) covering ${coverage.length} week(s)`;
  
  return { summary, assignments, coverage };
}

export function isInVacationMode(settings: VacationSettings): boolean {
  if (!settings.enabled) return false;
  const now = new Date();
  return now >= settings.startDate && now <= settings.endDate;
}

export function getVacationStatus(settings: VacationSettings): {
  status: 'inactive' | 'active' | 'upcoming' | 'ended';
  daysRemaining?: number;
  daysUntilStart?: number;
} {
  if (!settings.enabled) return { status: 'inactive' };
  
  const now = new Date();
  if (now < settings.startDate) {
    const daysUntilStart = Math.ceil((settings.startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return { status: 'upcoming', daysUntilStart };
  }
  
  if (now > settings.endDate) {
    return { status: 'ended' };
  }
  
  const daysRemaining = Math.ceil((settings.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return { status: 'active', daysRemaining };
}
