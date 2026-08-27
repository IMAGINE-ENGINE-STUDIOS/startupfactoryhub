import { useNavigate } from "react-router-dom";
import { Bot, Check, Rocket, Sparkles, Building2, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GENIUS_PLANS } from "@/lib/genius-plans";

const acceleratorPlans = [
  {
    key: "mvp",
    name: "MVP Program",
    price: 5000,
    unit: "per startup",
    icon: Rocket,
    highlight: true,
    tagline: "From idea to market-ready product",
    features: [
      "Build your MVP with our studio team",
      "10 hours of 1:1 mentor sessions",
      "Advisory & pitch deck review",
      "Investor ecosystem access",
      "Open to startups worldwide",
    ],
    cta: "Apply now",
    path: "/auth",
  },
  {
    key: "aaas",
    name: "Accelerator-as-a-Service",
    price: null,
    unit: "custom",
    icon: Building2,
    highlight: false,
    tagline: "Launch your own accelerator",
    features: [
      "Full white-label accelerator infrastructure",
      "Cohort & application management",
      "Mentor network & investor access",
      "Events, demo days & pitch programming",
      "Dedicated partnership support",
    ],
    cta: "Talk to partnerships",
    path: "/forpartners",
  },
];

const PricingPlansSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-12 sm:py-20 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[60%] h-[60%] bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.10)_0%,transparent_60%)]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Plans & Programs
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-primary via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Choose Your Path to Growth
            </span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Genius AI plans to power your workflow, and accelerator programs to take your venture global.
          </p>
        </div>

        {/* Genius AI Plans */}
        <div className="mb-14 sm:mb-20">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Bot className="w-5 h-5 text-primary" />
            <h3 className="text-xl sm:text-2xl font-semibold">Genius AI Plans</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {Object.values(GENIUS_PLANS).map((plan) => {
              const isPro = plan.key === "pro";
              return (
                <div
                  key={plan.key}
                  className={`tech-card border-0 rounded-2xl p-6 flex flex-col relative overflow-hidden transition-transform duration-300 hover:-translate-y-1 ${
                    isPro ? "ring-2 ring-primary/60" : ""
                  }`}
                >
                  {isPro && (
                    <Badge className="absolute top-4 right-4 bg-primary/20 text-primary border border-primary/30">
                      Most popular
                    </Badge>
                  )}
                  <p className="text-sm font-medium text-muted-foreground mb-1">{plan.name}</p>
                  <div className="flex items-end gap-1 mb-2">
                    {plan.price === null ? (
                      <span className="text-2xl font-bold text-foreground">Custom</span>
                    ) : plan.price === 0 ? (
                      <span className="text-3xl font-bold text-foreground">Free</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                        <span className="text-sm text-muted-foreground mb-1">/mo</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-primary/80 mb-4">{plan.allowance}</p>
                  <ul className="space-y-2 flex-1 mb-5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={isPro ? "hero" : "glass"}
                    className="w-full rounded-xl"
                    onClick={() => navigate("/auth")}
                  >
                    {plan.price === null ? "Contact us" : plan.price === 0 ? "Start free" : "Get started"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Accelerator Programs */}
        <div>
          <div className="flex items-center justify-center gap-2 mb-8">
            <GraduationCap className="w-5 h-5 text-primary" />
            <h3 className="text-xl sm:text-2xl font-semibold">Accelerator Programs</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-4xl mx-auto">
            {acceleratorPlans.map((plan) => (
              <div
                key={plan.key}
                className={`tech-card border-0 rounded-2xl p-7 sm:p-8 flex flex-col relative overflow-hidden transition-transform duration-300 hover:-translate-y-1 ${
                  plan.highlight ? "ring-2 ring-primary/60" : ""
                }`}
              >
                {plan.highlight && (
                  <Badge className="absolute top-4 right-4 bg-primary/20 text-primary border border-primary/30">
                    Open enrollment
                  </Badge>
                )}
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <plan.icon className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-lg font-semibold mb-1">{plan.name}</h4>
                <p className="text-sm text-muted-foreground mb-3">{plan.tagline}</p>
                <div className="flex items-end gap-1.5 mb-5">
                  {plan.price === null ? (
                    <span className="text-3xl font-bold text-foreground">Custom</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-foreground">
                        ${plan.price.toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground mb-1">{plan.unit}</span>
                    </>
                  )}
                </div>
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.highlight ? "hero" : "glass"}
                  size="lg"
                  className="w-full rounded-xl min-h-[48px]"
                  onClick={() => navigate(plan.path)}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingPlansSection;
