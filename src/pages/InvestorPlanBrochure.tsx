/**
 * /investor-plan — Investor Priority membership brochure.
 *
 * Editorial, data-driven presentation of the Investor Priority membership
 * ($500 / month, or $4,800 / year with 20% off). Pricing and benefits are
 * read live from public.subscription_plan_config (key = 'investor') through
 * the investor-plan feature module; checkout is resolved server-side.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { Check, Loader2, ArrowUpRight, Mail, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useInvestorPlan, formatCents } from '@/features/investor-plan/hooks/useInvestorPlan';
import { createInvestorPlanCheckout } from '@/features/investor-plan/api/investorPlanApi';
import type { InvestorBillingCycle, InvestorBenefit } from '@/features/investor-plan/types';

/* ------------------------------ primitives ------------------------------ */

/** Ambient animated backdrop, kept subtle so content stays legible. */
const AmbientField = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <motion.div
      className="absolute rounded-full"
      style={{
        width: 620, height: 620, left: '-15%', top: '-18%',
        background: 'radial-gradient(circle, hsl(var(--primary) / 0.18) 0%, transparent 68%)',
      }}
      animate={{ x: [0, 60, -20, 0], y: [0, 40, 80, 0] }}
      transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute rounded-full"
      style={{
        width: 680, height: 680, right: '-20%', bottom: '-22%',
        background: 'radial-gradient(circle, hsl(var(--accent) / 0.16) 0%, transparent 68%)',
      }}
      animate={{ x: [0, -50, 25, 0], y: [0, -35, -70, 0] }}
      transition={{ duration: 29, repeat: Infinity, ease: 'easeInOut' }}
    />
  </div>
);

/** Renders a Lucide icon by name, falling back to a neutral glyph. */
const BenefitIcon = ({ name, className }: { name: string; className?: string }) => {
  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name]
    ?? LucideIcons.Sparkles;
  return <Icon className={className} />;
};

const BenefitTile = ({ benefit, index }: { benefit: InvestorBenefit; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.4) }}
    className="tech-card border-0 rounded-2xl p-6 h-full"
  >
    <div className="flex items-start gap-4">
      <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/30">
        <BenefitIcon name={benefit.icon} className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[11px] text-muted-foreground">
            {String(index + 1).padStart(2, '0')}
          </span>
          <h3 className="font-semibold text-foreground leading-tight">{benefit.label}</h3>
        </div>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {benefit.description}
        </p>
      </div>
    </div>
  </motion.div>
);

/* -------------------------------- page --------------------------------- */

const InvestorPlanBrochure: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { config, monthlyEquivalentCents, yearlySavingsPercent } = useInvestorPlan();
  const [cycle, setCycle] = useState<InvestorBillingCycle>('monthly');
  const [checkingOut, setCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Create an account or sign in to activate Investor Priority.',
      });
      return;
    }
    setCheckingOut(true);
    try {
      const url = await createInvestorPlanCheckout(cycle);
      window.open(url, '_blank');
    } catch (error) {
      toast({
        title: 'Checkout unavailable',
        description: error instanceof Error ? error.message : 'Please try again shortly.',
        variant: 'destructive',
      });
    } finally {
      setCheckingOut(false);
    }
  };

  const priceLabel =
    cycle === 'monthly'
      ? `${formatCents(config.monthly_price_cents)}`
      : `${formatCents(monthlyEquivalentCents)}`;

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <Navigation />
      <AmbientField />

      <main className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-24">
        {/* Hero */}
        <section className="text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-xs font-mono uppercase tracking-[0.18em] text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Membership · Investors
          </span>
          <h1 className="mt-6 text-4xl md:text-6xl font-black tracking-tight text-foreground">
            Investor Priority
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-base md:text-lg text-muted-foreground leading-relaxed">
            The Startup Factory Hub membership built for capital. Proprietary dealflow,
            early allocation windows, shared-risk syndication and a seat inside every Batch.
          </p>
        </section>

        {/* Pricing */}
        <section className="mt-12 grid lg:grid-cols-[1.1fr_0.9fr] gap-6 items-stretch">
          <div className="tech-card border-0 rounded-3xl p-8">
            <div className="inline-flex rounded-full border border-border p-1 bg-muted/40">
              {(['monthly', 'yearly'] as InvestorBillingCycle[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCycle(c)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                    cycle === c
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {c === 'monthly' ? 'Monthly' : `Yearly · ${yearlySavingsPercent}% off`}
                </button>
              ))}
            </div>

            <div className="mt-8 flex items-end gap-3">
              <span className="text-6xl md:text-7xl font-black tracking-tight text-foreground">
                {priceLabel}
              </span>
              <span className="pb-3 text-muted-foreground font-mono text-sm">/ month</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {cycle === 'monthly'
                ? `${formatCents(config.monthly_price_cents)} billed monthly. Cancel anytime.`
                : `${formatCents(config.yearly_price_cents)} billed annually — ${yearlySavingsPercent}% below the monthly rate.`}
            </p>

            <Button
              onClick={handleCheckout}
              disabled={checkingOut}
              size="lg"
              className="mt-8 w-full sm:w-auto"
            >
              {checkingOut ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Opening checkout…
                </>
              ) : (
                <>
                  Activate Investor Priority <ArrowUpRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>

            <div className="mt-6 grid sm:grid-cols-2 gap-2">
              {['Priority allocation windows', 'Syndicated, shared-risk tickets',
                'Signal Score diligence data', 'Private Demo Days & pitch nights'].map((line) => (
                <div key={line} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  {line}
                </div>
              ))}
            </div>
          </div>

          <div className="tech-card border-0 rounded-3xl p-8 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-muted-foreground">
                Who it is for
              </h2>
              <p className="mt-4 text-foreground leading-relaxed">
                Angels, family offices, syndicates and venture funds that want structured,
                continuous access to the companies built and accelerated inside Startup
                Factory Hub — before the round is public.
              </p>
            </div>
            <div className="mt-8 space-y-3">
              <div className="flex items-center justify-between text-sm border-t border-border pt-3">
                <span className="text-muted-foreground">Monthly</span>
                <span className="font-mono text-foreground">
                  {formatCents(config.monthly_price_cents)} / mo
                </span>
              </div>
              <div className="flex items-center justify-between text-sm border-t border-border pt-3">
                <span className="text-muted-foreground">Annual (20% off)</span>
                <span className="font-mono text-foreground">
                  {formatCents(config.yearly_price_cents)} / yr
                </span>
              </div>
              <a
                href="mailto:info@startupfactoryhub.com"
                className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Mail className="h-4 w-4" /> info@startupfactoryhub.com
              </a>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="mt-16">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            What the membership unlocks
          </h2>
          <div className="mt-8 grid md:grid-cols-2 gap-4">
            {config.entitlements.map((benefit, i) => (
              <BenefitTile key={benefit.key} benefit={benefit} index={i} />
            ))}
          </div>
        </section>

        {/* Footer CTA */}
        <section className="mt-16 tech-card border-0 rounded-3xl p-10 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Capital moves first inside the Hub
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            Activate Investor Priority and get the dealflow, diligence and allocation access
            reserved for our investing members.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button onClick={handleCheckout} disabled={checkingOut} size="lg">
              Activate for {formatCents(config.monthly_price_cents)} / month
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/basic-plan">Compare with the Basic membership</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default InvestorPlanBrochure;
