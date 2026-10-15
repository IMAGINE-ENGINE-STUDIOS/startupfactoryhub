/**
 * APEX brochure — Imagine Engine, the platform's own AI coding application.
 * Uses the shared TechFeaturePage design with the purple Imagine theme.
 * Credits: Imagine Engine Studios Corp.
 */
import logo from '@/assets/imagine-engine-logo-purple.png';
import type { Feature } from './ApexEditorial';
import { TechFeaturePage, IMAGINE_THEME_INDEX } from './TechFeaturePage';

const IMAGINE: Feature = {
  no: '14',
  title: 'Imagine Engine',
  section: 'AI Coding',
  headline: 'From idea to working app, by chatting',
  deck: 'Our own AI coding application, built into the platform for every founder.',
  lead: 'Founders describe what they need and Imagine builds apps, websites and prototypes live, without a development team.',
  body: [
    'Build by chatting, edit on a visual canvas, automate with Flow, and start from ready blocks: CRM, store, kanban, games and 3D scenes.',
    'Apps connect to real databases (Supabase, SurrealDB), sync to GitHub, get Genius AI guidance and publish live in one click.',
  ],
  quote: 'Every Apex startup gets its own AI development team.',
  facts: [['AI', 'Coding by chat'], ['Real', 'Data & GitHub'], ['1-click', 'Publish live']],
};

export const ApexImagineEnginePage = ({ total }: { total: string }) => (
  <TechFeaturePage f={IMAGINE} index={IMAGINE_THEME_INDEX} total={total} image={logo} />
);
