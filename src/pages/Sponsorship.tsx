import { Rocket, Globe, Star, Sparkles, Award, MapPin, Users, Briefcase, Zap, CheckCircle2, Building2, Megaphone, Target, TrendingUp } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MatrixBackground from "@/components/MatrixBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Sponsorship = () => {
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
    { name: "Orlando / Lake Nona (HQ)", icon: Target },
    { name: "Santiago, Chile", icon: MapPin },
    { name: "Tokyo, Japan", icon: Globe }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <MatrixBackground />
      <Navigation />
      
      <main className="relative z-10 pt-24 pb-20">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="flex justify-center mb-6">
              <Rocket className="h-16 w-16 text-primary animate-pulse" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              STARTUP FACTORY HUB
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground">
              SPONSORSHIP PROGRAM
            </p>
          </div>

          {/* Tier Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {tiers.map((tier, index) => {
              const Icon = tier.icon;
              return (
                <Card 
                  key={tier.name}
                  className={`glass-morphism border-2 ${tier.borderColor} hover:scale-105 transition-all duration-300 ${tier.glowColor} shadow-xl animate-fade-in`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <Icon className={`h-8 w-8 bg-gradient-to-br ${tier.color} rounded-lg p-1.5 text-white`} />
                      <span className={`text-2xl font-bold bg-gradient-to-br ${tier.color} bg-clip-text text-transparent`}>
                        {tier.price}
                      </span>
                    </div>
                    <CardTitle className="text-2xl">{tier.name}</CardTitle>
                    <CardDescription>
                      {tier.name === "EARTHLING" && "Entry tier supporting the global SFH startup ecosystem"}
                      {tier.name === "STAR" && "For organizations ready to engage deeper with founders and cohorts"}
                      {tier.name === "NEBULA" && "High-engagement tier for companies seeking pilots, visibility, and deeper integration"}
                      {tier.name === "GALAXY" && "Top-tier, highest-impact partnership level"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Brand Visibility */}
                    <div>
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-2 text-primary">
                        <Megaphone className="h-4 w-4" />
                        Brand Visibility
                      </h4>
                      <ul className="space-y-1.5">
                        {tier.benefits.visibility.map((benefit, i) => (
                          <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Thought Leadership */}
                    {tier.benefits.thought && (
                      <div>
                        <h4 className="font-semibold text-sm flex items-center gap-2 mb-2 text-primary">
                          <Briefcase className="h-4 w-4" />
                          Thought Leadership
                        </h4>
                        <ul className="space-y-1.5">
                          {tier.benefits.thought.map((benefit, i) => (
                            <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Ecosystem Access */}
                    <div>
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-2 text-primary">
                        <Users className="h-4 w-4" />
                        Ecosystem Access
                      </h4>
                      <ul className="space-y-1.5">
                        {tier.benefits.access.map((benefit, i) => (
                          <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* SFH Platform Benefits */}
                    <div>
                      <h4 className="font-semibold text-sm flex items-center gap-2 mb-2 text-primary">
                        <Zap className="h-4 w-4" />
                        SFH Platform Benefits
                      </h4>
                      <ul className="space-y-1.5">
                        {tier.benefits.platform.map((benefit, i) => (
                          <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button 
                      className={`w-full mt-4 bg-gradient-to-br ${tier.color} hover:opacity-90 transition-opacity`}
                      onClick={() => window.location.href = 'mailto:partnerships@startupfactoryhub.com'}
                    >
                      Become a Sponsor
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Global Hubs Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-8 flex items-center justify-center gap-3">
              <Globe className="h-8 w-8 text-primary" />
              Global Hubs
            </h2>
            <div className="flex flex-wrap justify-center gap-6">
              {hubs.map((hub, index) => {
                const Icon = hub.icon;
                return (
                  <div 
                    key={hub.name}
                    className="flex items-center gap-2 glass-morphism px-6 py-3 rounded-full border border-primary/30 hover:border-primary/60 transition-all animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{hub.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Sponsorship;
