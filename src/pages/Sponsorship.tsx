import { Rocket, Globe, Star, Sparkles, Award, MapPin, Users, Briefcase, Zap, CheckCircle2, Building2, Megaphone, Target, TrendingUp, ChevronDown, Mail } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MatrixBackground from "@/components/MatrixBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

const Sponsorship = () => {
  const [openTiers, setOpenTiers] = useState<string[]>([]);

  const toggleTier = (tierName: string) => {
    setOpenTiers(prev => 
      prev.includes(tierName) 
        ? prev.filter(name => name !== tierName)
        : [...prev, tierName]
    );
  };

  const tiers = [
    {
      name: "EARTHLING",
      icon: Globe,
      price: "$5,000",
      color: "from-emerald-500 to-green-600",
      borderColor: "border-emerald-500/50",
      glowColor: "shadow-emerald-500/20",
      benefits: {
        visibility: [
          "Recognition as an EARTHLING Sponsor across Startup Factory Hub communications",
          "Logo displayed on the SFH website in the EARTHLING tier",
          "Welcome shoutout on LinkedIn and community updates"
        ],
        access: [
          "Access to selected virtual accelerator events",
          "Opportunity to offer perks, discounts, API credits, or tools to founders",
          "Access to the SFH Partner Resource Hub"
        ],
        platform: [
          "Listing as a partner in the Startup Factory Hub platform",
          "Ability to join the mentor/community network"
        ]
      }
    },
    {
      name: "STAR",
      icon: Star,
      price: "$15,000",
      color: "from-amber-500 to-orange-600",
      borderColor: "border-amber-500/50",
      glowColor: "shadow-amber-500/20",
      benefits: {
        visibility: [
          "Recognition as a STAR Sponsor at events and on digital materials",
          "Elevated logo position on the SFH website",
          "Monthly ecosystem spotlight in SFH newsletter"
        ],
        thought: [
          "Opportunity to host a guest workshop, AMA, or technical talk",
          "Direct mentoring opportunities with founders"
        ],
        access: [
          "Invitations to SFH networking events in New York, San Francisco, Orlando/Lake Nona, Santiago Chile, and Tokyo Japan",
          "Access to curated scouting reports and early-stage deal flow previews"
        ],
        platform: [
          "Mentor access in the platform",
          "Feature article or interview inside the SFH Media Hub"
        ]
      }
    },
    {
      name: "NEBULA",
      icon: Sparkles,
      price: "$30,000",
      color: "from-purple-500 to-indigo-600",
      borderColor: "border-purple-500/50",
      glowColor: "shadow-purple-500/20",
      benefits: {
        visibility: [
          "Recognition as a NEBULA Sponsor",
          "Premium visibility across all SFH touchpoints: Website, Platform dashboard, Cohort materials, Demo Day"
        ],
        thought: [
          "Guaranteed speaking opportunity at one SFH flagship event: Demo Day, Global Deep-Tech Roundtable, or Industry Vertical Summit",
          "Co-branded campaign: SFH × Sponsor"
        ],
        access: [
          "Full access to all global SFH networking events: New York, San Francisco, Orlando/Lake Nona, Santiago Chile, Tokyo",
          "Structured 1:1 startup matching sessions",
          "Ability to run pilot programs with startups"
        ],
        platform: [
          "Partner tools/demo integration into the SFH Marketplace",
          "A dedicated NEBULA Sponsor Resource Page for founders",
          "Access to non-sensitive startup data rooms (with permissions)"
        ]
      }
    },
    {
      name: "GALAXY",
      icon: Award,
      price: "$50,000",
      color: "from-pink-500 via-purple-500 to-cyan-500",
      borderColor: "border-primary/50",
      glowColor: "shadow-primary/20",
      benefits: {
        visibility: [
          "Recognition as GALAXY Strategic Partner (top tier)",
          "Premier logo placement across: Website, All major SFH events, Global summits, PR activations, Demo Day",
          "Joint PR announcement distributed globally: East Coast (New York), West Coast (San Francisco), LATAM (Chile), APAC (Japan)"
        ],
        thought: [
          "Keynote-level speaking slot at: SFH Global Summit, Demo Day, Frontier-Tech Conference",
          "Lead role in one innovation track: Space & Satellite Systems, Photonics & Quantum, AI & Cloud, Robotics & Automation, Advanced Materials"
        ],
        access: [
          "VIP access to every global SFH event",
          "Priority deal-flow access + curated startup introductions",
          "Private investor–startup dinners in: New York, San Francisco, Orlando, Tokyo, Santiago",
          "Co-designing pilot programs with cohort startups"
        ],
        platform: [
          "Full integration of sponsor technology into: The Dojo, AI Builder, Digital Twin, Startup Matching Engine",
          "A dedicated Sponsor Pavilion (virtual or physical)",
          "Custom analytics dashboard showing founder engagement"
        ]
      }
    }
  ];

  const hubs = [
    { name: "New York", icon: Building2 },
    { name: "San Francisco", icon: TrendingUp },
    { name: "Orlando (HQ)", icon: Target },
    { name: "Santiago, Chile", icon: MapPin },
    { name: "Tokyo, Japan", icon: Globe }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <MatrixBackground />
      <Navigation />
      
      <main className="pt-24 pb-20 relative z-10">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          {/* Header with Become Sponsor Button */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
              Sponsorship Program
            </h1>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 text-white font-semibold mb-4"
              onClick={() => window.location.href = 'mailto:info@startupfactoryhub.com'}
            >
              <Rocket className="mr-2 h-5 w-5" />
              Become a Sponsor
            </Button>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <a href="mailto:info@startupfactoryhub.com" className="hover:text-primary transition-colors">
                info@startupfactoryhub.com
              </a>
            </div>
          </div>

          {/* Tier Cards - Expandable */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20 max-w-6xl mx-auto">
            {tiers.map((tier, index) => {
              const Icon = tier.icon;
              const isOpen = openTiers.includes(tier.name);
              return (
                <Collapsible
                  key={tier.name}
                  open={isOpen}
                  onOpenChange={() => toggleTier(tier.name)}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Card className={`border-2 ${tier.borderColor} hover:${tier.glowColor} shadow-lg transition-all duration-300 overflow-hidden ${isOpen ? 'ring-2 ring-primary/20' : ''} min-h-[280px] flex flex-col`}>
                    <CollapsibleTrigger className="w-full text-left">
                      <CardHeader className="cursor-pointer hover:bg-accent/5 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${tier.color}`}>
                              <Icon className="h-8 w-8 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-2xl mb-1">{tier.name}</CardTitle>
                              <span className={`text-3xl font-bold bg-gradient-to-br ${tier.color} bg-clip-text text-transparent`}>
                                {tier.price}
                              </span>
                            </div>
                          </div>
                          <ChevronDown className={`h-6 w-6 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                        <CardDescription className="mt-4 text-base">
                          {tier.name === "EARTHLING" && "Entry tier supporting the global SFH startup ecosystem"}
                          {tier.name === "STAR" && "For organizations ready to engage deeper with founders and cohorts"}
                          {tier.name === "NEBULA" && "High-engagement tier for companies seeking pilots, visibility, and deeper integration"}
                          {tier.name === "GALAXY" && "Top-tier, highest-impact partnership level"}
                        </CardDescription>
                      </CardHeader>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <CardContent className="space-y-6 pt-0 pb-6">
                        {/* Brand Visibility */}
                        <div className="bg-accent/20 rounded-lg p-4">
                          <h4 className="font-semibold text-sm flex items-center gap-2 mb-3 text-primary">
                            <Megaphone className="h-5 w-5" />
                            Brand Visibility
                          </h4>
                          <ul className="space-y-2">
                            {tier.benefits.visibility.map((benefit, i) => (
                              <li key={i} className="flex gap-2 text-sm text-foreground">
                                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Thought Leadership */}
                        {tier.benefits.thought && (
                          <div className="bg-accent/20 rounded-lg p-4">
                            <h4 className="font-semibold text-sm flex items-center gap-2 mb-3 text-primary">
                              <Briefcase className="h-5 w-5" />
                              Thought Leadership
                            </h4>
                            <ul className="space-y-2">
                              {tier.benefits.thought.map((benefit, i) => (
                                <li key={i} className="flex gap-2 text-sm text-foreground">
                                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                  <span>{benefit}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Ecosystem Access */}
                        <div className="bg-accent/20 rounded-lg p-4">
                          <h4 className="font-semibold text-sm flex items-center gap-2 mb-3 text-primary">
                            <Users className="h-5 w-5" />
                            Ecosystem Access
                          </h4>
                          <ul className="space-y-2">
                            {tier.benefits.access.map((benefit, i) => (
                              <li key={i} className="flex gap-2 text-sm text-foreground">
                                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* SFH Platform Benefits */}
                        <div className="bg-accent/20 rounded-lg p-4">
                          <h4 className="font-semibold text-sm flex items-center gap-2 mb-3 text-primary">
                            <Zap className="h-5 w-5" />
                            SFH Platform Benefits
                          </h4>
                          <ul className="space-y-2">
                            {tier.benefits.platform.map((benefit, i) => (
                              <li key={i} className="flex gap-2 text-sm text-foreground">
                                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                <span>{benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <Button 
                          className={`w-full bg-gradient-to-br ${tier.color} hover:opacity-90 transition-opacity text-white font-semibold py-6 text-lg`}
                          onClick={() => window.location.href = 'mailto:info@startupfactoryhub.com'}
                        >
                          Contact Us
                        </Button>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>

          {/* Global Hubs Section */}
          <div className="max-w-5xl mx-auto">
            <Card className="border-2 border-primary/30 shadow-xl bg-gradient-to-br from-background via-background to-primary/5">
              <CardHeader className="text-center pb-8">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <Globe className="h-12 w-12 text-primary" />
                    <div className="absolute inset-0 blur-xl bg-primary/30 animate-pulse" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-bold">Global Hubs</CardTitle>
                <CardDescription className="text-base mt-2">
                  Our worldwide presence across key innovation ecosystems
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {hubs.map((hub, index) => {
                    const Icon = hub.icon;
                    return (
                      <div 
                        key={hub.name}
                        className="flex flex-col items-center gap-3 p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-accent/10 transition-all duration-300 animate-fade-in group"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-semibold text-sm">{hub.name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Sponsorship;
