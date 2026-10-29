import members from '@/assets/live/pkg-members.jpg';
import investor from '@/assets/live/pkg-investor.jpg';
import ai from '@/assets/live/pkg-ai.jpg';
import office from '@/assets/live/pkg-office.jpg';
// Original photos used by the same packages on the main page pricing section.
import investorMain from '@/assets/wtc-institutional.jpg';
import desk from '@/assets/membership/plan-desk.jpg';
import globalImg from '@/assets/membership/plan-global.jpg';
import corporate from '@/assets/membership/plan-corporate.jpg';

// Startup Factory Hub paid packages a host can drop into a live call.
// Prices mirror the real Stripe prices; the live-checkout function resolves the Stripe price by id server-side.
export type SfhPackage = { id: string; name: string; price: number; interval: 'month' | 'year'; tag: string; image: string; brochure?: string; perks: string[] };

export const SFH_PACKAGES: SfhPackage[] = [
  { id: 'members-monthly', brochure: '/basic-plan', name: 'Members Club', price: 50, interval: 'month', tag: 'MEMBERSHIP', image: members, perks: ['11 member-only platform tools', 'Events, programs and investor access'] },
  { id: 'members-yearly', brochure: '/basic-plan', name: 'Members Club (Annual)', price: 480, interval: 'year', tag: 'MEMBERSHIP', image: members, perks: ['Everything in Members Club', '2 months free'] },
  { id: 'investor-monthly', brochure: '/investor-plan', name: 'Investor Priority', price: 500, interval: 'month', tag: 'INVESTOR', image: investorMain, perks: ['Priority deal flow', 'Direct founder introductions'] },
  { id: 'investor-yearly', brochure: '/investor-plan', name: 'Investor Priority (Annual)', price: 5000, interval: 'year', tag: 'INVESTOR', image: investorMain, perks: ['Everything in Investor Priority', 'Yearly savings'] },
  { id: 'imagine-starter', name: 'Imagine Starter', price: 9, interval: 'month', tag: 'AI CREDITS', image: ai, perks: ['180 AI credits every month', 'Unused credits roll over'] },
  { id: 'imagine-pro', name: 'Imagine Pro', price: 29, interval: 'month', tag: 'AI CREDITS', image: ai, perks: ['600 AI credits every month', 'Priority generation'] },
  { id: 'imagine-studio', name: 'Imagine Studio', price: 60, interval: 'month', tag: 'AI CREDITS', image: ai, perks: ['1,400 AI credits every month', 'Best value per credit'] },
  { id: 'community', brochure: '/forpartners', name: 'Community', price: 350, interval: 'month', tag: 'ACCELERATOR', image: office, perks: ['Community accelerator access', 'Mentors and programs'] },
  { id: 'self-paced-office', brochure: '/forpartners', name: 'Venture Resident', price: 550, interval: 'month', tag: 'ACCELERATOR', image: desk, perks: ['Venture studio acceleration', 'Dedicated hub desk + Strategic Business Intelligence'] },
  { id: 'global-access', brochure: '/forpartners', name: 'Global Venture Partner', price: 950, interval: 'month', tag: 'ACCELERATOR', image: globalImg, perks: ['Private office in 130+ countries', 'Priority investor access & soft landing'] },
  { id: 'corporate', brochure: '/forpartners', name: 'Corporate', price: 1500, interval: 'month', tag: 'ACCELERATOR', image: corporate, perks: ['Team accelerator seats', 'Corporate innovation support'] },
];
