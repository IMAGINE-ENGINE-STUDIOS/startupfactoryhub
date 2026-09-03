import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bot,
  Check,
  Rocket,
  Sparkles,
  Building2,
  GraduationCap,
  Users,
  Loader2,
  TrendingUp,
  Handshake,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GENIUS_PLANS } from "@/lib/genius-plans";
import { MEMBERSHIP_TIERS, type MembershipTier } from "@/lib/membership-tiers";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import PlanBrochureOverlay, { type PlanOverlayKind } from "@/components/PlanBrochureOverlay";
// Editorial imagery reused from the WTC brochure for the Investor Priority ad banner.
import investorBannerBg from "@/assets/wtc-institutional.jpg";
import investorBannerTile from "@/assets/wtc-kpi-capital.jpg";
// Ultra-chromatic imagery, one per membership widget.
import imgPlanBasic from "@/assets/membership/plan-basic.jpg";
import imgPlanDesk from "@/assets/membership/plan-desk.jpg";
import imgPlanGlobal from "@/assets/membership/plan-global.jpg";
import imgPlanCorporate from "@/assets/membership/plan-corporate.jpg";
import imgAccInstitutional from "@/assets/membership/acc-institutional.jpg";
import imgAccCohorts from "@/assets/membership/acc-cohorts.jpg";
// Accelerator program imagery — venture studio floor for the MVP Program,
// institutional campus for the white-label Accelerator-as-a-Service track.
import imgProgramMvp from "@/assets/membership/venture-studio.jpg";
import imgProgramAaas from "@/assets/membership/campus-atrium.jpg";


const startupMemberships: {
  key: Exclude<MembershipTier, "free"> | "basic";
  image: string;
  tagline: string;
  bestFor: string;
  features: string[];
  highlight?: boolean;
  /** Renders a fixed-price card that deep-links to the Basic Plan brochure checkout. */
  basic?: boolean;
  /** Hides the price and routes the CTA to sales instead of checkout. */
  contactSales?: boolean;
}[] = [
  {
    key: "basic",
    basic: true,
    image: imgPlanBasic,
    tagline: "Full digital access, virtual events, community, and mentor interactions.",
    bestFor: "Remote-first teams or early MVP-stage founders",
    features: [
      "Post on the social feed & resource map",
      "Full resource library access",
      "Internships & volunteering roles",
      "Technology transfer & certified courses",
    ],
  },

  {
    key: "self_paced_office",
    image: imgPlanDesk,
    tagline: "Adds local Startup Factory HUB Desk coworking access all locations.",
    bestFor: "Founders needing flexible workspace + virtual resources",
    features: [
      "All community features",
      "Local Startup Factory HUB Desk coworking access all locations",
      "Earth Intelligence satellite data access",
      "Eligible for Accelerated Tier",
    ],
    highlight: true,
  },
  {
    key: "global_access",
    image: imgPlanGlobal,
    tagline: "All platform features + unlimited global office access (130+ countries, 5,600+ sites).",
    bestFor: "Globally distributed teams, traveling founders",
    features: [
      "All features + Global office access across Startup Factory Hub network",
      "Mentor + event access",
      "Earth Intelligence satellite data access",
      "Eligible for Accelerated Tier",
    ],
  },
  {
    key: "corporate",
    contactSales: true,
    image: imgPlanCorporate,
    tagline: "For corporate innovation teams and growth-stage startups with regional teams.",
    bestFor: "Scale-ups or corporate venture units",
    features: [
      "All features + team dashboard",
      "Security — live CCTV surveillance feeds on the global map",
      "Global coworking access",
      "Soft Landing discount ($5,000) for global expansion",
    ],
  },
];

/**
 * Accelerator section — one unified 4-card grid that mixes organization
 * memberships ($5,000/mo Institutional + quote-based Cohorts) with the two
 * accelerator programs (MVP Program, Accelerator-as-a-Service) so buyers see
 * every accelerator-facing offer side by side. Cards with `path` navigate;
 * the rest fall back to a sales email.
 */
const acceleratorMemberships: {
  key: string;
  name: string;
  /** null renders "Contact Sales" / the `priceLabel` instead of a number. */
  price: number | null;
  /** Suffix shown next to the price (e.g. "/mo" or "per startup · one-time"). */
  priceUnit: string;
  /** Exact price label when the card must not show "Contact Sales". */
  priceLabel?: string;
  image: string;
  bestFor: string;
  features: string[];
  highlight?: boolean;
  cta: string;
  /** When set, the CTA navigates instead of opening a sales email. */
  path?: string;
}[] = [
  {
    key: "acc_institutional",
    name: "Institutional",
    price: 5000,
    priceUnit: "/mo",
    image: imgAccInstitutional,
    bestFor: "Institutional programs and corporate venture units",
    features: [
      "Full accelerator infrastructure",
      "Dedicated partnership manager",
      "Earth Intelligence & data suite access",
      "Global office & coworking network access",
    ],
    highlight: true,
    cta: "Talk to us",
  },
  {
    key: "mvp",
    name: "MVP Program",
    price: 5000,
    priceUnit: "per startup · one-time payment",
    image: imgProgramMvp,
    bestFor: "From idea to market-ready product in 4 weeks",
    features: [
      "Build your MVP with our studio team",
      "10 hours of 1:1 mentor sessions",
      "Advisory & pitch deck review",
      "Investor ecosystem access",
    ],
    cta: "Apply now",
    path: "/auth",
  },
  {
    key: "aaas",
    name: "Accelerator-as-a-Service",
    price: null,
    priceUnit: "custom",
    priceLabel: "Custom",
    image: imgProgramAaas,
    bestFor: "Launch your own accelerator on our infrastructure",
    features: [
      "White-label accelerator infrastructure",
      "Cohort & application management",
      "Mentor network & investor access",
      "Events, demo days & pitch programming",
    ],
    cta: "Talk to partnerships",
    path: "/forpartners",
  },
  {
    key: "acc_cohorts",
    name: "Cohorts",
    price: null,
    priceUnit: "",
    image: imgAccCohorts,
    bestFor: "Extending platform benefits to all your cohort startups",
    features: [
      "Seats for every startup in your batch",
      "Full member benefits & perks for cohort founders",
      "Shared cohort dashboard & progress tracking",
      "Custom volume agreement",
    ],
    cta: "Contact Sales",
  },
];

const PricingPlansSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [checkoutKey, setCheckoutKey] = useState<string | null>(null);
  /** Which plan brochure flipbook is open as a popup over this page. */
  const [planOverlay, setPlanOverlay] = useState<PlanOverlayKind | null>(null);

  const handleSubscribe = async (key: string, priceId: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setCheckoutKey(key);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const { data, error } = await supabase.functions.invoke("create-membership-checkout", {
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Could not start checkout");
    } finally {
      setCheckoutKey(null);
    }
  };



  const shell =
    "group relative flex flex-col overflow-hidden rounded-3xl tech-card border-0 p-5 sm:p-6 transition-all duration-500 hover:-translate-y-1.5 sm:min-h-[27rem]";

  const Corners = () => (
    <>
      <span className="pointer-events-none absolute left-0 top-0 h-8 w-8 rounded-tl-3xl border-l border-t border-primary/40 opacity-60 transition-opacity duration-500 group-hover:opacity-100" />
      <span className="pointer-events-none absolute bottom-0 right-0 h-8 w-8 rounded-br-3xl border-b border-r border-primary/40 opacity-60 transition-opacity duration-500 group-hover:opacity-100" />
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    </>
  );

  const SectionTitle = ({
    title,
    subtitle,
  }: {
    title: string;
    subtitle?: string;
  }) => (
    <div className="mb-7 sm:mb-9 flex flex-col items-center gap-3 text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5">
        <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-foreground">
          {title}
        </h3>
      </div>
      {subtitle && (
        <p className="max-w-2xl text-xs sm:text-sm text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );

  /**
   * Banner-style media header used by every membership widget. Mirrors the
   * Investor Priority banner: ultra-chromatic imagery, animated zoom + sheen.
   */
  const PlanMedia = ({ src, alt }: { src: string; alt: string }) => (
    <div className="relative -mx-5 -mt-5 mb-4 h-28 overflow-hidden sm:-mx-6 sm:-mt-6 sm:h-32">
      <img
        src={src}
        alt={alt}
        width={1024}
        height={640}
        loading="lazy"
        className="h-full w-full object-cover saturate-150 transition-transform duration-[1200ms] ease-out group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-transparent" />
      <div className="absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 bg-[linear-gradient(115deg,transparent_35%,hsl(var(--primary)/0.35)_50%,transparent_65%)]" />
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
    </div>
  );

  return (
    <section className="relative overflow-hidden py-12 sm:py-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-[60%] w-[60%] bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.10)_0%,transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(hsl(var(--primary))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary))_1px,transparent_1px)] [background-size:56px_56px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        {/* Header */}
        <div className="mb-10 text-center sm:mb-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Plans & Programs
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            <span className="bg-gradient-to-r from-primary via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Choose Your Path to Growth
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-lg">
            Genius AI plans to power your workflow, and accelerator programs to take your venture global.
          </p>
        </div>

        {/* Genius AI Plans */}
        <div className="mb-14 sm:mb-20">
          <SectionTitle title="Genius AI Plans" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5">
            {Object.values(GENIUS_PLANS).map((plan) => {
              const isPro = plan.key === "pro";
              return (
                <div
                  key={plan.key}
                  className={`${shell} ${isPro ? "ring-1 ring-primary/60 shadow-[0_0_40px_-12px_hsl(var(--primary)/0.5)]" : ""}`}
                >
                  <Corners />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {plan.name}
                  </p>
                  <div className="mb-1 mt-2 flex items-end gap-1">
                    {plan.price === null ? (
                      <span className="text-2xl font-bold text-foreground">Custom</span>
                    ) : plan.price === 0 ? (
                      <span className="text-3xl font-bold text-foreground">Free</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                        <span className="mb-1 text-xs text-muted-foreground">/mo</span>
                      </>
                    )}
                  </div>
                  <p className="mb-3 text-[11px] text-primary/80">{plan.allowance}</p>
                  <div className="mb-4 h-px w-full bg-gradient-to-r from-primary/30 to-transparent" />
                  <ul className="mb-4 flex-1 space-y-1.5 overflow-y-auto pr-1 text-xs">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-muted-foreground">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        <span className="leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={isPro ? "hero" : "glass"}
                    className="w-full rounded-xl min-h-[44px] text-xs sm:text-sm"
                    onClick={() => navigate("/auth")}
                  >
                    {plan.price === null ? "Contact us" : plan.price === 0 ? "Start free" : "Get started"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Startup Memberships */}
        <div className="mb-14 sm:mb-20">
          <SectionTitle
            title="Startup, Student & Advisor Memberships"
            subtitle="Subscriptions for startups, students and advisors in the ecosystem — community, workspace and global office access. Advisors join the Basic Plan at $250/mo."
          />

          <div className="mb-8 flex justify-center">
            <div className="inline-flex items-center rounded-full border border-border/50 bg-muted/40 p-1">
              {(["monthly", "yearly"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setBilling(mode)}
                  className={`rounded-full px-4 py-1.5 text-[11px] sm:text-xs font-medium transition-colors ${
                    billing === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {mode === "monthly" ? "Monthly" : "Yearly · save 10%"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5">
            {startupMemberships.map((plan) => {
              const tier = plan.basic ? null : MEMBERSHIP_TIERS[plan.key as Exclude<MembershipTier, "free">];
              const price = plan.basic
                ? billing === "monthly" ? 50 : 480
                : billing === "monthly" ? tier!.price : tier!.yearly_price;
              const priceId = tier ? (billing === "monthly" ? tier.price_id : tier.yearly_price_id) : null;
              return (
                <div
                  key={plan.key}
                  className={`${shell} ${plan.highlight ? "ring-1 ring-primary/60 shadow-[0_0_40px_-12px_hsl(var(--primary)/0.5)]" : ""}`}
                >
                  <Corners />
                  {plan.highlight && (
                    <Badge className="absolute right-4 top-4 z-10 border border-primary/30 bg-primary/20 text-[10px] text-primary">
                      Popular
                    </Badge>
                  )}
                  <PlanMedia src={plan.image} alt={plan.basic ? "Basic Plan" : tier!.name} />
                  <h4 className="text-sm font-semibold">{plan.basic ? "Basic Plan" : tier!.name}</h4>
                  <div className="mb-2 mt-1 flex items-end gap-1">
                    {plan.contactSales ? (
                      <span className="text-2xl sm:text-3xl font-bold text-foreground">Contact Sales</span>
                    ) : (
                      <>
                        <span className="text-2xl sm:text-3xl font-bold text-foreground">
                          ${price.toLocaleString()}
                        </span>
                        <span className="mb-1 text-xs text-muted-foreground">
                          {billing === "monthly" ? "/mo" : "/yr"}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="mb-3 text-[11px] leading-snug text-primary/80">{plan.bestFor}</p>
                  <div className="mb-3 h-px w-full bg-gradient-to-r from-primary/30 to-transparent" />
                  <ul className="mb-4 flex-1 space-y-1.5 overflow-y-auto pr-1 text-xs">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-muted-foreground">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        <span className="leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.highlight ? "hero" : "glass"}
                    className="w-full rounded-xl min-h-[44px] text-xs sm:text-sm"
                    disabled={checkoutKey === plan.key}
                    onClick={() => {
                      if (plan.basic) return setPlanOverlay("basic");
                      if (plan.contactSales) {
                        window.location.href = "mailto:info@startupfactoryhub.com?subject=Corporate%20Plan%20Inquiry";
                        return;
                      }
                      if (priceId) handleSubscribe(plan.key, priceId);
                    }}
                  >
                    {checkoutKey === plan.key ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : plan.basic ? (
                      "View Basic Plan"
                    ) : plan.contactSales ? (
                      "Contact Sales"
                    ) : user ? (
                      "Subscribe"
                    ) : (
                      "Sign in to subscribe"
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Accelerator Memberships & Programs */}
        <div className="mb-14 sm:mb-20">
          <SectionTitle
            title="Accelerator Memberships & Programs"
            subtitle="For accelerators, incubators and innovation programs — memberships plus the MVP Program and Accelerator-as-a-Service."
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5">
            {acceleratorMemberships.map((plan) => {
              return (
                <div
                  key={plan.key}
                  className={`${shell} ${plan.highlight ? "ring-1 ring-primary/60 shadow-[0_0_40px_-12px_hsl(var(--primary)/0.5)]" : ""}`}
                >
                  <Corners />
                  {plan.highlight && (
                    <Badge className="absolute right-4 top-4 z-10 border border-primary/30 bg-primary/20 text-[10px] text-primary">
                      Popular
                    </Badge>
                  )}
                  <PlanMedia src={plan.image} alt={plan.name} />
                  <h4 className="text-sm font-semibold">{plan.name}</h4>
                  <div className="mb-2 mt-1 flex items-end gap-1">
                    {plan.price === null ? (
                      <span className="text-2xl sm:text-3xl font-bold text-foreground">
                        {plan.priceLabel ?? "Contact Sales"}
                      </span>
                    ) : (
                      <>
                        <span className="text-2xl sm:text-3xl font-bold text-foreground">
                          ${plan.price.toLocaleString()}
                        </span>
                        {plan.priceUnit && (
                          <span className="mb-1 text-xs text-muted-foreground">{plan.priceUnit}</span>
                        )}
                      </>
                    )}
                  </div>
                  <p className="mb-3 text-[11px] leading-snug text-primary/80">{plan.bestFor}</p>
                  <div className="mb-3 h-px w-full bg-gradient-to-r from-primary/30 to-transparent" />
                  <ul className="mb-4 flex-1 space-y-1.5 overflow-y-auto pr-1 text-xs">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-muted-foreground">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        <span className="leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.highlight ? "hero" : "glass"}
                    className="w-full rounded-xl min-h-[44px] text-xs sm:text-sm"
                    onClick={() => {
                      if (plan.path) return navigate(plan.path);
                      window.location.href = `mailto:info@startupfactoryhub.com?subject=${encodeURIComponent(
                        `Accelerator Membership — ${plan.name}`,
                      )}`;
                    }}
                  >
                    {plan.cta}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* White-label option for accelerators — no pricing, appointment only */}
          <div className="mx-auto mt-5 max-w-4xl">
            <div className="relative overflow-hidden rounded-3xl tech-card border-0 p-5 sm:p-6 flex flex-col gap-4 sm:flex-row sm:items-center">
              <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-60" />
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-semibold">White-label for Accelerators</h4>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Run the entire platform under your own brand — your domain, your identity, your cohorts,
                  with full application, mentor and demo-day infrastructure included.
                </p>
              </div>
              <Button
                variant="hero"
                className="rounded-xl min-h-[44px] text-xs sm:text-sm shrink-0"
                onClick={() => navigate("/forpartners")}
              >
                Schedule appointment
              </Button>
            </div>
          </div>
        </div>

        {/* Investor Priority — advertising banner opening the flipbook brochure */}
        <div className="mb-14 sm:mb-20 mx-auto max-w-5xl">
          <button
            type="button"
            onClick={() => setPlanOverlay("investor")}
            className="group relative block w-full overflow-hidden rounded-3xl border border-primary/20 text-left shadow-[0_30px_80px_-40px_hsl(var(--primary)/0.6)]"
          >
            {/* Imagery layer */}
            <div className="absolute inset-0">
              <img
                src={investorBannerBg}
                alt="Institutional investor network"
                className="h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
              <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(hsl(var(--primary))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary))_1px,transparent_1px)] [background-size:44px_44px]" />
            </div>

            <div className="relative z-10 flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-9">
              <div className="max-w-xl">
                <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-primary">
                  Invitation only
                </p>
                <h4 className="mt-2 text-2xl font-bold leading-tight tracking-tight sm:text-4xl">
                  <span className="bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
                    Investor Priority
                  </span>
                </h4>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  Unique dealflow before it goes public, early-stage allocations, shared-risk syndicates
                  and a seat inside every cohort we run.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Exclusive dealflow", "Early allocations", "Shared-risk syndicates", "Cohort access"].map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-primary"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="hidden shrink-0 sm:block">
                <div className="relative h-40 w-56 overflow-hidden rounded-2xl border border-primary/25">
                  <img
                    src={investorBannerTile}
                    alt="Global capital network visualization"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
                </div>
              </div>
            </div>

            <div className="relative z-10 border-t border-primary/15 bg-background/50 px-6 py-4 backdrop-blur-sm sm:px-9">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary sm:text-sm">
                Open the Investor Priority brochure
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </span>
            </div>
          </button>
        </div>


      </div>

      <PlanBrochureOverlay plan={planOverlay} onClose={() => setPlanOverlay(null)} />
    </section>
  );
};

export default PricingPlansSection;
