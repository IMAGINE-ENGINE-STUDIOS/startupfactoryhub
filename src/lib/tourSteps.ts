// Interactive tour step definitions, role-aware.
// Each step targets either a CSS selector on the current page,
// or shows a centered card (when `selector` is omitted).

export type TourSide = 'top' | 'bottom' | 'left' | 'right' | 'auto';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  /** Where to navigate before showing this step. */
  route?: string;
  /** Optional ?tab= value to set on the dashboard before showing. */
  tab?: string;
  /** CSS selector for the element to spotlight. Omit for a centered modal step. */
  selector?: string;
  /** Preferred side for the tooltip + arrow. */
  side?: TourSide;
}

export type TourRole =
  | 'student'
  | 'startup'
  | 'mentor'
  | 'advisor'
  | 'investor'
  | 'accelerator'
  | 'admin'
  | null;

const COMMON_INTRO: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Startup Factory Hub',
    description:
      "Let's take a 60-second tour of the essentials: your profile, posting, events, meetings and the global resources map.",
  },
  {
    id: 'profile',
    title: 'Your profile',
    description:
      'Open your profile from here to edit your bio, avatar, skills and visibility.',
    selector: '[data-tour="profile-button"]',
    side: 'bottom',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description:
      'Mentions, bookings and platform updates land here in real time.',
    selector: '[data-tour="notifications-button"]',
    side: 'bottom',
  },
  {
    id: 'wallet',
    title: 'Wallet & passes',
    description:
      'Your active membership passes, perks and benefits live here — flight passes, intros, and more.',
    selector: '[data-tour="wallet-button"]',
    side: 'bottom',
  },
  {
    id: 'recommendations',
    title: 'Smart recommendations',
    description:
      'We surface tailored matches, opportunities and people for you here.',
    selector: '[data-tour="recommendations-button"]',
    side: 'bottom',
  },
];

const COMMON_DASHBOARD: TourStep[] = [
  {
    id: 'social',
    title: 'Post to the community',
    description:
      'Share an update, ask a question or celebrate a milestone in the Social feed.',
    tab: 'social',
    selector: '[data-tour="composer"]',
    side: 'bottom',
  },
  {
    id: 'create-event',
    title: 'Create events',
    description:
      'From the Calendar tab you can publish public or private events in two clicks.',
    tab: 'calendar',
    selector: '[data-tour="create-event"]',
    side: 'left',
  },
  {
    id: 'create-meeting',
    title: 'Create meetings',
    description:
      'Schedule 1:1 sessions and group meetings — links are generated automatically.',
    tab: 'calendar',
    selector: '[data-tour="create-meeting"]',
    side: 'left',
  },
  {
    id: 'network',
    title: 'Browse the network',
    description:
      'Find mentors, investors, startups, advisors and students across the platform.',
    tab: 'network',
    selector: '[role="tabpanel"][data-state="active"]',
    side: 'top',
  },
];

const RESOURCES_MAP: TourStep = {
  id: 'resources-map',
  title: 'The Resources Map',
  description:
    'A live, interactive 4D map of hubs, events, opportunities and resources around the world.',
  route: '/4d-map',
};

const FLOATING_CHAT: TourStep = {
  id: 'floating-chat',
  title: 'Genius AI assistant',
  description:
    'Ask anything: write a pitch, draft an email, summarize a doc, or explore the platform.',
  selector: '[data-tour="floating-chat"]',
  side: 'left',
};

const JOURNEY: TourStep = {
  id: 'journey',
  title: 'Your startup journey',
  description:
    'Track your progress through the startup roadmap — milestones, tasks and completion at a glance.',
  tab: 'journey',
  selector: '[data-tour="journey-tab"]',
  side: 'bottom',
};

const FINISH: TourStep = {
  id: 'finish',
  title: "You're set",
  description:
    'You can replay this tour any time from the Help button in the top-right corner.',
  selector: '[data-tour="help-button"]',
  side: 'bottom',
};

export function getTourSteps(role: TourRole): TourStep[] {
  const dashboardRoute = '/dashboard';
  const withRoute = (s: TourStep): TourStep => ({
    ...s,
    route: s.route ?? dashboardRoute,
  });

  const base: TourStep[] = [
    ...COMMON_INTRO,
    ...COMMON_DASHBOARD,
    // Journey is only present on the Startup dashboard.
    ...(role === 'startup' ? [JOURNEY] : []),
    RESOURCES_MAP,
    FLOATING_CHAT,
    FINISH,
  ];

  return base.map(withRoute);
}
