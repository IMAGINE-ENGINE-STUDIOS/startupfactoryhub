/**
 * Ecosystem Partners brochure — Imagine Engine page.
 * Partner-directed copy of the APEX brochure's Imagine Engine page.
 * Credits: Imagine Engine Studios Corp.
 */
import logo from '@/assets/imagine-engine-logo-purple.png';
import type { Feature } from '../apex/ApexEditorial';
import { TechFeaturePage, IMAGINE_THEME_INDEX, type FeatureBrand } from '../apex/TechFeaturePage';

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
  quote: 'Every startup in your program gets its own AI development team.',
  facts: [['AI', 'Coding by chat'], ['Real', 'Data & GitHub'], ['1-click', 'Publish live']],
};

export const EcosystemImagineEnginePage = ({ total, brand }: { total: string; brand: FeatureBrand }) => (
  <TechFeaturePage f={IMAGINE} index={IMAGINE_THEME_INDEX} total={total} image={logo} brand={brand} />
);
