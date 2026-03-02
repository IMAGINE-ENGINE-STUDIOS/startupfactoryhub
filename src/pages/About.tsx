import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Users, Target, Rocket, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const About = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <section className="py-20 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-ocean-dark/20 to-background" />
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          {/* Header */}
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 tracking-wide">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                {t('about.title')}
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              {t('about.subtitle')}
            </p>
          </div>

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
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">🤖 {t('about.aiMatching')}</h3>
                <p className="text-sm text-muted-foreground">{t('about.aiMatchingDesc')}</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">🌐 {t('about.globalCommunity')}</h3>
                <p className="text-sm text-muted-foreground">{t('about.globalCommunityDesc')}</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">📚 {t('about.eduResources')}</h3>
                <p className="text-sm text-muted-foreground">{t('about.eduResourcesDesc')}</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">💼 {t('about.jobBoard')}</h3>
                <p className="text-sm text-muted-foreground">{t('about.jobBoardDesc')}</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">💰 {t('about.funding')}</h3>
                <p className="text-sm text-muted-foreground">{t('about.fundingDesc')}</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">🎯 {t('about.mentorship')}</h3>
                <p className="text-sm text-muted-foreground">{t('about.mentorshipDesc')}</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <Link 
              to="/auth"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-primary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              <Rocket className="h-5 w-5" />
              {t('about.joinCommunityToday')}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
