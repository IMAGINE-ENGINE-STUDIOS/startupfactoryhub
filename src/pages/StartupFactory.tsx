/**
 * /startup-factory — landing page for the "Startup Factory" search phrase.
 * Credits: Imagine Engine Studios Corp.
 */
import { Link } from 'react-router-dom';
import { Rocket, Users, Brain, Coins, Globe, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePageSeo } from '@/hooks/usePageSeo';

const PILLARS = [
  { icon: Brain, t: 'AI-powered acceleration', d: 'Genius AI guides each founder with strategy, next steps and business intelligence.' },
  { icon: Map, t: 'Clear startup journey', d: 'A staged path from idea to growth, with the right resources at every step.' },
  { icon: Users, t: 'Mentors and advisors', d: 'A network of mentors, advisors and partners founders can book directly.' },
  { icon: Coins, t: 'Investor access', d: 'Startups prepare for and connect with investors through the platform.' },
  { icon: Globe, t: 'Global venture network', d: 'Programs, perks and hubs for founders building across borders.' },
  { icon: Rocket, t: 'Build and launch', d: 'Imagine Engine, our AI coding application, helps teams build their product.' },
];

const TEAM = ['Khalia Padilla, CEO', 'Ricardo Font, COO', 'James Stuber, Legal', 'Dominic Catrambone, CFO', 'N. MacDonnell Ulsch, Senior Advisor'];

export default function StartupFactory() {
  usePageSeo({
    title: 'Startup Factory — AI Startup Accelerator & Venture Builder | Startup Factory Hub',
    description: 'Startup Factory is an AI hybrid startup accelerator and venture builder. We build, accelerate, scale and invest in global startups with mentors, investors and resources.',
    path: '/startup-factory',
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="container max-w-5xl py-20 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Startup Factory Hub</p>
        <h1 className="mt-4 font-display text-4xl md:text-6xl font-bold">Startup Factory</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          An AI hybrid startup accelerator and venture builder community. We build, accelerate, scale, and invest in global startups.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg"><Link to="/auth">Apply to Startup Factory</Link></Button>
          <Button asChild size="lg" variant="outline"><Link to="/members-club">Join the Venture Network</Link></Button>
        </div>
      </section>

      <section className="container max-w-5xl pb-16">
        <h2 className="font-display text-2xl md:text-3xl font-semibold">What Startup Factory offers founders</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map(({ icon: I, t, d }) => (
            <article key={t} className="tech-card border-0 rounded-xl p-5">
              <I className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container max-w-5xl pb-16 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl font-semibold">How to join</h2>
          <ol className="mt-4 space-y-2 text-muted-foreground list-decimal list-inside">
            <li>Create your free account on Startup Factory Hub.</li>
            <li>Complete your startup profile and journey stage.</li>
            <li>Upgrade to the Venture Network ($50/month) to unlock the full platform.</li>
          </ol>
          <p className="mt-4 text-sm">
            Learn more: <Link className="text-primary underline" to="/about">About us</Link> · <Link className="text-primary underline" to="/mvp-program">MVP program</Link> · <Link className="text-primary underline" to="/resources">Resources</Link>
          </p>
        </div>
        <div>
          <h2 className="font-display text-2xl font-semibold">The Startup Factory team</h2>
          <ul className="mt-4 space-y-1 text-muted-foreground">{TEAM.map((m) => <li key={m}>{m}</li>)}</ul>
        </div>
      </section>
    </main>
  );
}
