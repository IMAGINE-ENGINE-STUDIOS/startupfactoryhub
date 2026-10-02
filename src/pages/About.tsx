import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import CommunitySection from "@/components/CommunitySection";
import FeaturesSection from "@/components/FeaturesSection";
import { Target, Rocket, Brain, Globe, BookOpen, Briefcase, Banknote } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import bannerBg from "@/assets/wtc-institutional.jpg";

const offerItems = [
  { icon: Brain, labelKey: "about.aiMatching", descKey: "about.aiMatchingDesc" },
  { icon: Globe, labelKey: "about.globalCommunity", descKey: "about.globalCommunityDesc" },
  { icon: BookOpen, labelKey: "about.eduResources", descKey: "about.eduResourcesDesc" },
  { icon: Briefcase, labelKey: "about.jobBoard", descKey: "about.jobBoardDesc" },
  { icon: Banknote, labelKey: "about.funding", descKey: "about.fundingDesc" },
  { icon: Target, labelKey: "about.mentorship", descKey: "about.mentorshipDesc" },
];

const About = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero — full-bleed banner with the same glassmorphic overlay used in Investor Priority */}
      <section className="relative overflow-hidden border-b border-primary/20">
        {/* Imagery layer */}
        <div className="absolute inset-0">
          <img
            src={bannerBg}
            alt="Startup Factory Hub ecosystem"
            className="h-full w-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
        </div>

        {/* Full-bleed animated glassmorphic overlay */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Slow-spinning transparent conic sheen */}
          <div className="absolute -inset-1/2 animate-[spin_26s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0deg,hsl(var(--primary)/0.10)_100deg,transparent_200deg,hsl(var(--primary)/0.06)_280deg,transparent_360deg)] opacity-70" />
          {/* Soft radial glows */}
          <div className="absolute right-0 top-0 h-full w-3/4 bg-[radial-gradient(circle_at_75%_25%,hsl(var(--primary)/0.18)_0%,transparent_55%)]" />
          <div className="absolute left-0 bottom-0 h-3/4 w-1/2 bg-[radial-gradient(circle_at_20%_80%,hsl(var(--primary)/0.10)_0%,transparent_50%)]" />
          {/* Fine grid */}
          <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(hsl(var(--primary))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary))_1px,transparent_1px)] [background-size:44px_44px]" />
          {/* Floating glass orbs */}
          <div className="absolute right-[12%] top-[18%] h-28 w-28 rounded-full bg-primary/[0.10] blur-3xl animate-pulse" />
          <div className="absolute right-[28%] bottom-[22%] h-36 w-36 rounded-full bg-primary/[0.08] blur-3xl animate-pulse [animation-delay:1s]" />
          <div className="absolute right-[6%] bottom-[12%] h-20 w-20 rounded-full bg-primary/[0.12] blur-2xl animate-pulse [animation-delay:2s]" />
          {/* Orbit rings */}
          <div className="absolute right-[20%] top-1/2 h-48 w-48 -translate-y-1/2 rounded-full border border-primary/10" />
          <div className="absolute right-[16%] top-1/2 h-64 w-64 -translate-y-1/2 rounded-full border border-primary/5" />
          {/* Rising bars along the right edge */}
          <div className="absolute inset-x-4 bottom-0 flex items-end justify-end gap-1.5 sm:inset-x-10">
            {[28, 46, 34, 62, 50, 78, 68, 92, 58, 84].map((h, i) => (
              <span
                key={i}
                className="w-2 sm:w-3 rounded-t-sm bg-gradient-to-t from-primary/50 to-primary/20 opacity-50"
                style={{ height: `${h * 0.55}px`, animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        </div>

        <div className="container relative z-10 mx-auto px-4 sm:px-6 py-20 sm:py-32">
          <div className="max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-primary">
              Startup Factory Hub
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              <span className="bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent">
                {t('about.title')}
              </span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-lg">
              {t('about.subtitle')}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["AI matching", "Global community", "Mentorship", "Funding"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="relative z-10 py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="glass-card p-8 rounded-xl border border-ocean-border hover-scale">
              <div className="w-12 h-12 rounded-lg bg-gradient-primary/20 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-4 text-foreground">{t('about.ourMission')}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('about.missionDesc')}
              </p>
            </div>

            <div className="glass-card p-8 rounded-xl border border-ocean-border hover-scale">
              <div className="w-12 h-12 rounded-lg bg-gradient-primary/20 flex items-center justify-center mb-4">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-4 text-foreground">{t('about.ourVision')}</h2>
              <p className="text-muted-foreground leading-relaxed">
                {t('about.visionDesc')}
              </p>
            </div>
          </div>

          {/* What We Offer */}
          <div className="glass-card p-8 sm:p-12 rounded-xl border border-ocean-border">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center text-foreground">
              {t('about.whatMakesDifferent')}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {offerItems.map(({ icon: Icon, labelKey, descKey }) => (
                <div key={labelKey} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-foreground">{t(labelKey)}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{t(descKey)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              <Rocket className="h-5 w-5" />
              {t('about.joinCommunityToday')}
            </Link>
          </div>
        </div>
      </section>

      <CommunitySection />
      <FeaturesSection />

      <Footer />
    </div>
  );
};

export default About;
