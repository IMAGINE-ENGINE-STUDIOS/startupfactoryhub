/**
 * Ecosystem Partners brochure — the platform feature pages' copy.
 * A partner-directed copy of FEATURES from the APEX brochure: same 14
 * capabilities, with the operator reframed from APEX to the licensing
 * partner ("you"). Hand-checked line by line for grammar.
 * Credits: Imagine Engine Studios Corp.
 */
import type { Feature } from '../apex/ApexEditorial';

export const ECOSYSTEM_FEATURES: Feature[] = [
  {
    no: '01', title: 'Centralized Resource Hubs', section: 'Resources',
    headline: 'Every resource a startup needs, mapped in one hub',
    deck: 'We map capital, programs, infrastructure and perks by industry, stage and need, so each founder sees what applies to them.',
    lead: '', body: [], quote: '',
    map: [
      ['Investors', ['Venture capital funds', 'Angel networks and syndicates', 'Corporate venture arms', 'Family offices']],
      ['Incubators and accelerators', ['University incubators', 'Cohort and corporate accelerators', 'Industry-specific programs', 'International soft-landing programs']],
      ['Labs', ['Research and national labs', 'University labs', 'Maker and hardware labs', 'Testing and prototyping facilities']],
      ['Technology transfer programs', ['University tech transfer offices', 'Federal lab licensing', 'Patent and IP licensing', 'Research commercialization grants']],
      ['Banks and lenders', ['Business banking', 'SBA-backed loans', 'Venture debt', 'Revenue-based financing']],
      ['Grants and public funding', ['SBIR and STTR', 'Federal agency grants', 'State and local economic development', 'Foundation grants']],
    ],
    facts: [['11', 'Resource categories'], ['3', 'Filters: industry, stage, need'], ['1', 'Searchable hub']],
  },
  {
    no: '01', title: 'Centralized Resource Hubs', section: 'Resources',
    headline: 'Contracting, training, perks, events and offices, in one hub',
    deck: 'The second half of our resource map: what founders need to sell to government, build skills, lower costs, meet the ecosystem and find a place to work.',
    lead: '', body: [], quote: '',
    map: [
      ['Government contracting', ['SAM.gov registration', 'Contract opportunities', 'Certifications and set-asides', 'Proposal preparation']],
      ['Programs and training', ['Courses and workshops', 'Pitch and investor readiness', 'Legal and financial guides', 'Templates and toolkits']],
      ['Partner perks', ['Cloud and software credits', 'Legal and accounting services', 'Marketing and sales tools', 'Workspace discounts']],
      ['Events', ['Pitch days and demo days', 'Investor and networking events', 'Industry days and conferences', 'Webinars and workshops']],
      ['Office spaces', ['Private offices', 'Coworking desks', 'Meeting rooms', 'Virtual offices and business addresses']],
    ],
    facts: [],
  },
  {
    no: '02', title: 'Network of Mentors and Advisors', section: 'Mentorship',
    headline: 'A mentor network that shows its value',
    deck: 'Profiles with expertise, industry and availability, scheduling built in, and feedback that proves which relationships work.',
    lead: 'Mentorship is the most valuable asset an accelerator has, and the hardest to measure. The platform turns it into a managed, visible program.',
    body: [
      'Mentors and advisors publish their expertise, industry and availability. Founders book directly through built-in calendars, without email chains.',
      'Meeting records, follow-ups, ratings and feedback are kept in one place, so you can see which relationships move companies forward.',
    ],
    quote: 'Every meeting recorded, every follow-up tracked, every outcome visible.',
    facts: [['Built-in', 'Scheduling and calendars'], ['Rated', 'Mentor feedback'], ['Tracked', 'Follow-ups']],
  },
  {
    no: '03', title: 'AI-Powered Business and Strategic Intelligence', section: 'Intelligence',
    headline: 'Strategy that knows where each company stands',
    deck: 'AI that reads each startup\u2019s profile and stage, across every industry, and suggests concrete next actions.',
    lead: 'Generic advice serves no one. A pre-seed hardware team and a growth-stage fintech need entirely different guidance, and the platform knows the difference.',
    body: [
      'The AI analyzes each company\u2019s profile, industry and stage, then recommends specific next steps, resources and strategies.',
      'Pre-seed hardware teams receive validation, prototyping and readiness guidance. Growth fintechs receive scaling, market-expansion and capital strategy.',
    ],
    quote: 'Guidance matched to where each startup actually is.',
    facts: [['Every', 'Industry covered'], ['Stage', 'Aware recommendations'], ['24/7', 'Availability']],
  },
  {
    no: '04', title: 'Journey Mapping', section: 'Journey',
    headline: 'A clear path from idea to growth',
    deck: 'Six stages, each with milestones, recommended resources and suggested mentors.',
    lead: 'Founders progress faster when they know what comes next. Journey Mapping makes the path explicit, from first idea to scaled operations.',
    body: [
      'Idea, MVP, Technology Readiness, Commercialization, Investment and Growth: each stage carries defined milestones and the resources that support them.',
      'Technology readiness is tracked through TRL stages, giving you and your government partners a common language for maturity.',
    ],
    quote: 'Each stage has milestones, resources and the right mentors attached.',
    facts: [['6', 'Journey stages'], ['TRL', 'Readiness tracking'], ['1', 'Shared roadmap']],
  },
  {
    no: '05', title: 'Administrator Management', section: 'Administration',
    headline: 'A control center for the whole program',
    deck: 'Add resources, manage mentors, onboard cohorts and assign pathways, without technical support.',
    lead: 'Program staff should run programs, not software. Administrator Management gives you one place to operate everything.',
    body: [
      'Staff add and update resources, manage mentors and advisors, onboard cohorts and assign startups to pathways from a single console.',
      'Activity across the program is visible at a glance, so administrators intervene where it matters instead of chasing status updates.',
    ],
    quote: 'One console to run the program, with no technical support needed.',
    facts: [['1', 'Control center'], ['0', 'Developers required'], ['All', 'Cohorts in one view']],
  },
  {
    no: '06', title: 'Embedded Corporate Partner Resources', section: 'Partners',
    headline: 'Corporate partner value, delivered in context',
    deck: 'Partner offers, tools, credits and programs integrated where founders need them.',
    lead: 'Partner perks often go unused because founders never find them. On the platform, they appear at the stage where they matter.',
    body: [
      'Offers, software credits and partner programs are already integrated. Founders see them in context, alongside the milestone they support.',
      'There is no integration work for you or for partners, and partners gain visibility and measurable engagement with qualified companies.',
    ],
    quote: 'Partner resources that founders actually find, and actually use.',
    facts: [['Embedded', 'Partner offers'], ['0', 'Integration work'], ['Measured', 'Engagement']],
  },
  {
    no: '07', title: 'Data Analytics', section: 'Analytics',
    headline: 'A live view of the ecosystem',
    deck: 'Data that guides decisions, informs stakeholders and demonstrates impact.',
    lead: 'Decisions about public programs deserve current data. Analytics gives you a continuous picture of the ecosystem and your own performance.',
    body: [
      'Industry growth trends, investment activity, resource allocation and utilization, stage progression and commercialization outcomes are tracked live.',
      'Leadership sees what is working, reallocates effort with evidence and reports to stakeholders without manual data collection.',
    ],
    quote: 'Evidence, not estimates, behind every program decision.',
    facts: [['5', 'Core indicators'], ['Live', 'Dashboards'], ['Ready', 'For stakeholders']],
  },
  {
    no: '08', title: 'Space for National and International Expansion', section: 'Expansion',
    headline: 'Space for national and international growth',
    deck: '5,800 locations in 130 countries, including 1,500 in the United States.',
    lead: 'Opening a new hub usually means site-by-site negotiation. Through one partner, you can operate in new cities and run the same program everywhere.',
    body: [
      'Access to a global network of flexible workspaces lets you extend your footprint without long leases or local procurement.',
      'Every location runs on the same platform, so founders in any city receive the same resources, mentors and standards.',
    ],
    quote: 'One partner, one program, thousands of locations.',
    facts: [['5,800', 'Locations'], ['130', 'Countries'], ['1,500', 'In the United States']],
  },
  {
    no: '09', title: 'Investor Network', section: 'Capital',
    headline: 'Investor-ready companies, matched to the right investors',
    deck: 'Investor profiles by focus area and stage, with introductions and outcomes tracked.',
    lead: 'When a company reaches the investment stage, the right introduction is decisive. The Investor Network makes that match deliberate.',
    body: [
      'Investors maintain profiles with focus areas and stage preferences. Startups that reach investment readiness are connected to relevant investors.',
      'You track every introduction and its outcome, building a record of capital mobilized through your program.',
    ],
    quote: 'Every introduction deliberate, every outcome on record.',
    facts: [['Focus', 'Matched profiles'], ['Stage', 'Preferences respected'], ['Tracked', 'Introductions']],
  },
  {
    no: '10', title: 'AI Grant and Funding Matching', section: 'Funding',
    headline: 'Non-dilutive funding, matched by AI',
    deck: 'Grants and non-dilutive programs matched by industry, stage and technology readiness.',
    lead: 'Grant opportunities are numerous and fragmented. AI matching puts the right programs in front of the right companies.',
    body: [
      'Each startup is matched to grants and non-dilutive funding according to its industry, stage and technology readiness level.',
      'You see how much funding your companies pursue and win, a direct measure of your program\u2019s economic contribution.',
    ],
    quote: 'More founders pursuing, and winning, the funding they qualify for.',
    facts: [['AI', 'Grant matching'], ['TRL', 'Aware filters'], ['Visible', 'Funding won']],
  },
  {
    no: '11', title: 'Global Soft-Landing', section: 'Global',
    headline: 'A soft landing in any market',
    deck: 'Test and enter a new country from inside your program.',
    lead: 'International expansion is risky for small companies. Global Soft-Landing lowers that risk by keeping founders inside a familiar program.',
    body: [
      'A startup can establish local presence in a new country with workspace, the same platform, mentors and resources it already uses.',
      'You extend your reach abroad while your companies keep continuity of support across borders.',
    ],
    quote: 'New markets, the same program, the same support.',
    facts: [['130', 'Countries reachable'], ['Same', 'Platform abroad'], ['Local', 'Workspace']],
  },
  {
    no: '12', title: 'Impact Reporting', section: 'Impact',
    headline: 'Impact reports, ready for sponsors and government',
    deck: 'Jobs created, capital raised and companies commercialized, exported on demand.',
    lead: 'Public programs answer to sponsors and government partners. Impact Reporting turns program activity into clear, exportable evidence.',
    body: [
      'Reports for sponsors, government partners and investors show jobs created, capital raised and startups commercialized.',
      'Data is collected as the program runs, so no one compiles spreadsheets by hand at the end of a reporting period.',
    ],
    quote: 'Accountability built into the platform, not added at year end.',
    facts: [['Jobs', 'Created'], ['Capital', 'Raised'], ['Export', 'On demand']],
  },
  {
    no: '13', title: 'White-Label Branding', section: 'Brand',
    headline: 'Your own innovation platform',
    deck: 'Full white-label branding for startups, mentors and partners.',
    lead: 'The platform carries your name. Founders, mentors and partners experience it as your innovation platform, end to end.',
    body: [
      'Branding, domain and identity reflect your brand throughout, reinforcing your role at the center of your ecosystem.',
      'Startup Factory Hub operates the technology in the background, so you own the relationship and the experience.',
    ],
    quote: 'You own the experience. We power it.',
    facts: [['100%', 'Your branding'], ['1', 'Unified identity'], ['0', 'Third-party logos']],
  },
];
