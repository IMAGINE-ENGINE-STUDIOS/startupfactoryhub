import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Home, Rocket, Target, Users, Lightbulb, TrendingUp, Globe, Award, Mail, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import sfhLogo from '@/assets/sfh-logo-sphere.png';

interface Slide {
  id: number;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  background: string;
  icon?: React.ReactNode;
}

const slides: Slide[] = [
  {
    id: 1,
    title: "Startup Factory Hub",
    subtitle: "Empowering the Next Generation of Innovators",
    background: "from-primary/20 via-background to-accent/10",
    content: (
      <div className="flex flex-col items-center gap-8">
        <img src={sfhLogo} alt="Startup Factory Hub" className="w-32 h-32 object-contain" />
        <p className="text-xl text-muted-foreground text-center max-w-2xl">
          A comprehensive platform connecting startups, investors, mentors, and accelerators worldwide.
        </p>
      </div>
    ),
    icon: <Rocket className="h-8 w-8" />
  },
  {
    id: 2,
    title: "The Problem",
    subtitle: "Fragmented Startup Ecosystem",
    background: "from-destructive/10 via-background to-destructive/5",
    content: (
      <div className="grid gap-6 max-w-3xl">
        <div className="tech-card p-6 backdrop-blur-sm">
          <h3 className="font-semibold text-lg mb-2 text-destructive">🔍 Limited Access</h3>
          <p className="text-muted-foreground">Startups struggle to find the right mentors, investors, and resources at critical stages.</p>
        </div>
        <div className="tech-card p-6 backdrop-blur-sm">
          <h3 className="font-semibold text-lg mb-2 text-destructive">🌐 Disconnected Networks</h3>
          <p className="text-muted-foreground">Investors miss quality deals, mentors can't reach promising founders efficiently.</p>
        </div>
        <div className="tech-card p-6 backdrop-blur-sm">
          <h3 className="font-semibold text-lg mb-2 text-destructive">📊 Lack of Structure</h3>
          <p className="text-muted-foreground">No unified platform for accelerators to manage cohorts and track startup progress.</p>
        </div>
      </div>
    ),
    icon: <Target className="h-8 w-8" />
  },
  {
    id: 3,
    title: "Our Solution",
    subtitle: "All-in-One Innovation Platform",
    background: "from-primary/20 via-background to-secondary/10",
    content: (
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
        <div className="tech-card p-6 backdrop-blur-sm border-primary/30">
          <h3 className="font-semibold text-lg mb-2 text-primary">For Startups</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>✓ AI-powered mentor matching</li>
            <li>✓ Investor network access</li>
            <li>✓ Growth roadmap tracking</li>
            <li>✓ Resource library & tools</li>
          </ul>
        </div>
        <div className="tech-card p-6 backdrop-blur-sm border-accent/30">
          <h3 className="font-semibold text-lg mb-2 text-accent">For Investors</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>✓ Curated deal flow</li>
            <li>✓ Portfolio management</li>
            <li>✓ Due diligence tools</li>
            <li>✓ Investment tracking</li>
          </ul>
        </div>
        <div className="tech-card p-6 backdrop-blur-sm border-secondary/30">
          <h3 className="font-semibold text-lg mb-2 text-secondary">For Mentors</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>✓ Session scheduling</li>
            <li>✓ Mentee management</li>
            <li>✓ Impact tracking</li>
            <li>✓ Endorsement system</li>
          </ul>
        </div>
        <div className="tech-card p-6 backdrop-blur-sm border-primary/30">
          <h3 className="font-semibold text-lg mb-2 text-primary">For Accelerators</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>✓ Cohort management</li>
            <li>✓ Startup journey tracking</li>
            <li>✓ Alumni portfolio</li>
            <li>✓ Demo day organization</li>
          </ul>
        </div>
      </div>
    ),
    icon: <Lightbulb className="h-8 w-8" />
  },
  {
    id: 4,
    title: "Key Features",
    subtitle: "Powered by Innovation",
    background: "from-accent/20 via-background to-primary/10",
    content: (
      <div className="grid md:grid-cols-3 gap-4 max-w-5xl">
        {[
          { title: "AI Recommendations", desc: "Smart matching algorithms" },
          { title: "Video Conferencing", desc: "Integrated virtual meetings" },
          { title: "Document Suite", desc: "LightPaper productivity tools" },
          { title: "Global Events", desc: "Networking opportunities" },
          { title: "Job Board", desc: "Talent acquisition" },
          { title: "Market Intelligence", desc: "Real-time insights" },
        ].map((feature, i) => (
          <div key={i} className="tech-card p-4 backdrop-blur-sm text-center">
            <h4 className="font-semibold text-primary">{feature.title}</h4>
            <p className="text-sm text-muted-foreground">{feature.desc}</p>
          </div>
        ))}
      </div>
    ),
    icon: <Award className="h-8 w-8" />
  },
  {
    id: 5,
    title: "Our Network",
    subtitle: "Growing Global Community",
    background: "from-secondary/20 via-background to-accent/10",
    content: (
      <div className="grid md:grid-cols-4 gap-8 max-w-4xl text-center">
        <div className="tech-card p-6 backdrop-blur-sm">
          <div className="text-4xl font-bold text-primary mb-2">500+</div>
          <div className="text-muted-foreground">Startups</div>
        </div>
        <div className="tech-card p-6 backdrop-blur-sm">
          <div className="text-4xl font-bold text-accent mb-2">150+</div>
          <div className="text-muted-foreground">Mentors</div>
        </div>
        <div className="tech-card p-6 backdrop-blur-sm">
          <div className="text-4xl font-bold text-secondary mb-2">75+</div>
          <div className="text-muted-foreground">Investors</div>
        </div>
        <div className="tech-card p-6 backdrop-blur-sm">
          <div className="text-4xl font-bold text-primary mb-2">25+</div>
          <div className="text-muted-foreground">Countries</div>
        </div>
      </div>
    ),
    icon: <Users className="h-8 w-8" />
  },
  {
    id: 6,
    title: "Market Opportunity",
    subtitle: "$25B+ Global Accelerator Market",
    background: "from-primary/20 via-background to-secondary/10",
    content: (
      <div className="max-w-3xl space-y-6">
        <div className="tech-card p-6 backdrop-blur-sm">
          <h3 className="font-semibold text-lg mb-4 text-primary">Growth Drivers</h3>
          <ul className="space-y-3 text-muted-foreground">
            <li className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>15% CAGR in startup ecosystem growth</span>
            </li>
            <li className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-accent" />
              <span>Increasing global entrepreneurship</span>
            </li>
            <li className="flex items-center gap-3">
              <Lightbulb className="h-5 w-5 text-secondary" />
              <span>Digital transformation of business support</span>
            </li>
          </ul>
        </div>
        <div className="tech-card p-6 backdrop-blur-sm">
          <h3 className="font-semibold text-lg mb-2 text-accent">Target Markets</h3>
          <p className="text-muted-foreground">North America, Europe, Asia-Pacific, Latin America, Middle East & Africa</p>
        </div>
      </div>
    ),
    icon: <TrendingUp className="h-8 w-8" />
  },
  {
    id: 7,
    title: "Business Model",
    subtitle: "Sustainable Revenue Streams",
    background: "from-accent/20 via-background to-primary/10",
    content: (
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl">
        <div className="tech-card p-6 backdrop-blur-sm">
          <h3 className="font-semibold text-lg mb-4 text-primary">Subscription Tiers</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Free tier for startups</li>
            <li>• Premium for advanced features</li>
            <li>• Enterprise for accelerators</li>
            <li>• Investor Pro access</li>
          </ul>
        </div>
        <div className="tech-card p-6 backdrop-blur-sm">
          <h3 className="font-semibold text-lg mb-4 text-accent">Additional Revenue</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li>• Cohort enrollment fees</li>
            <li>• Success-based commissions</li>
            <li>• Corporate partnerships</li>
            <li>• Sponsored events</li>
          </ul>
        </div>
      </div>
    ),
    icon: <Award className="h-8 w-8" />
  },
  {
    id: 8,
    title: "Join Our Mission",
    subtitle: "Let's Build the Future Together",
    background: "from-primary/30 via-background to-accent/20",
    content: (
      <div className="flex flex-col items-center gap-8 max-w-2xl text-center">
        <p className="text-xl text-muted-foreground">
          We're looking for partners, investors, and innovators who share our vision of democratizing access to startup success.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a href="mailto:contact@startupfactoryhub.com" className="inline-flex items-center gap-2 tech-card px-6 py-3 hover:border-primary/50 transition-colors">
            <Mail className="h-5 w-5 text-primary" />
            <span>Contact Us</span>
          </a>
          <a href="https://startupfactoryhub.lovable.app" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 tech-card px-6 py-3 hover:border-accent/50 transition-colors">
            <ExternalLink className="h-5 w-5 text-accent" />
            <span>Visit Platform</span>
          </a>
        </div>
        <img src={sfhLogo} alt="Startup Factory Hub" className="w-24 h-24 object-contain opacity-80" />
      </div>
    ),
    icon: <Rocket className="h-8 w-8" />
  }
];

export default function Deck() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      nextSlide();
    } else if (e.key === 'ArrowLeft') {
      prevSlide();
    } else if (e.key === 'Escape') {
      navigate('/');
    }
  };

  const slide = slides[currentSlide];

  return (
    <div 
      className="min-h-screen flex flex-col bg-background"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2">
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Home</span>
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {currentSlide + 1} / {slides.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevSlide} disabled={currentSlide === 0}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={nextSlide} disabled={currentSlide === slides.length - 1}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Slide Content */}
      <div className="flex-1 flex items-center justify-center pt-20 pb-24 px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className={`w-full max-w-6xl mx-auto flex flex-col items-center gap-8 bg-gradient-to-br ${slide.background} rounded-3xl p-8 md:p-12 min-h-[70vh]`}
          >
            <div className="flex items-center gap-4 text-primary">
              {slide.icon}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-center bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              {slide.title}
            </h1>
            {slide.subtitle && (
              <p className="text-lg md:text-xl text-muted-foreground text-center">
                {slide.subtitle}
              </p>
            )}
            <div className="flex-1 flex items-center justify-center w-full">
              {slide.content}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide Indicators */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-2 py-4 bg-background/80 backdrop-blur-sm border-t border-border/50">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide 
                ? 'bg-primary w-8' 
                : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
