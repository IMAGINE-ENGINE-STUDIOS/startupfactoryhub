import { Home, Rocket, Target, Users, Lightbulb, TrendingUp, Globe, Award, Mail, ExternalLink, Printer, Search, Network, BarChart3, Briefcase, GraduationCap, Building2, Diamond, Video, FileText, Calendar, Cpu, DollarSign, Handshake, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import sfhLogo from '@/assets/sfh-logo-sphere.png';

// Geometric Pattern Components
const TechGrid = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none print:hidden">
    {/* Horizontal lines */}
    {[...Array(20)].map((_, i) => (
      <div 
        key={`h-${i}`} 
        className="absolute w-full h-px bg-gradient-to-r from-transparent via-teal-500/10 to-transparent"
        style={{ top: `${(i + 1) * 5}%` }}
      />
    ))}
    {/* Vertical lines */}
    {[...Array(20)].map((_, i) => (
      <div 
        key={`v-${i}`} 
        className="absolute h-full w-px bg-gradient-to-b from-transparent via-teal-500/10 to-transparent"
        style={{ left: `${(i + 1) * 5}%` }}
      />
    ))}
  </div>
);

const FloatingHexagons = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none print:hidden">
    {/* Top right hexagon cluster */}
    <div className="absolute top-20 right-20 w-32 h-32 border border-teal-500/20 rotate-12" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
    <div className="absolute top-32 right-32 w-20 h-20 border border-cyan-500/15 -rotate-6" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
    {/* Bottom left hexagon cluster */}
    <div className="absolute bottom-20 left-20 w-24 h-24 border border-teal-500/15 rotate-45" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
    <div className="absolute bottom-32 left-10 w-16 h-16 border border-cyan-500/10 -rotate-12" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
  </div>
);

const CornerAccents = () => (
  <div className="absolute inset-0 pointer-events-none print:hidden">
    {/* Top left */}
    <div className="absolute top-4 left-4">
      <div className="w-12 h-px bg-gradient-to-r from-teal-500 to-transparent" />
      <div className="w-px h-12 bg-gradient-to-b from-teal-500 to-transparent" />
    </div>
    {/* Top right */}
    <div className="absolute top-4 right-4">
      <div className="w-12 h-px bg-gradient-to-l from-teal-500 to-transparent ml-auto" />
      <div className="w-px h-12 bg-gradient-to-b from-teal-500 to-transparent ml-auto" />
    </div>
    {/* Bottom left */}
    <div className="absolute bottom-4 left-4">
      <div className="w-px h-12 bg-gradient-to-t from-teal-500 to-transparent" />
      <div className="w-12 h-px bg-gradient-to-r from-teal-500 to-transparent" />
    </div>
    {/* Bottom right */}
    <div className="absolute bottom-4 right-4">
      <div className="w-px h-12 bg-gradient-to-t from-teal-500 to-transparent ml-auto" />
      <div className="w-12 h-px bg-gradient-to-l from-teal-500 to-transparent ml-auto" />
    </div>
  </div>
);

const SlideContainer = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <section className={`relative min-h-screen flex flex-col items-center justify-center p-8 md:p-16 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 print:min-h-0 print:py-12 print:break-after-page print:bg-white ${className}`}>
    {/* Border frame */}
    <div className="absolute inset-4 border-2 border-teal-500/30 rounded-lg print:border-gray-300" />
    <TechGrid />
    <FloatingHexagons />
    <CornerAccents />
    <div className="relative z-10 w-full max-w-6xl mx-auto">
      {children}
    </div>
  </section>
);

const SectionDivider = ({ title }: { title: string }) => (
  <div className="flex items-center gap-4 mb-8">
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-teal-500/50 to-teal-500" />
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 bg-teal-500 rotate-45" />
      <span className="text-sm font-semibold text-teal-400 tracking-widest uppercase print:text-gray-700">{title}</span>
      <div className="w-2 h-2 bg-teal-500 rotate-45" />
    </div>
    <div className="flex-1 h-px bg-gradient-to-l from-transparent via-teal-500/50 to-teal-500" />
  </div>
);

const TechCard = ({ children, className = "", glowColor = "teal" }: { children: React.ReactNode; className?: string; glowColor?: string }) => {
  const glowClasses = {
    teal: "border-teal-500/40 hover:border-teal-500/60 shadow-teal-500/10",
    cyan: "border-cyan-500/40 hover:border-cyan-500/60 shadow-cyan-500/10",
    purple: "border-purple-500/40 hover:border-purple-500/60 shadow-purple-500/10",
    emerald: "border-emerald-500/40 hover:border-emerald-500/60 shadow-emerald-500/10",
    amber: "border-amber-500/40 hover:border-amber-500/60 shadow-amber-500/10",
    rose: "border-rose-500/40 hover:border-rose-500/60 shadow-rose-500/10",
  };
  return (
    <div className={`relative bg-slate-900/80 border-2 rounded-lg p-6 backdrop-blur-sm shadow-lg print:bg-white print:border-gray-300 print:shadow-none ${glowClasses[glowColor as keyof typeof glowClasses] || glowClasses.teal} ${className}`}>
      {/* Top glow line */}
      <div className={`absolute top-0 left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-${glowColor}-500/60 to-transparent print:hidden`} />
      {children}
    </div>
  );
};

const IconBadge = ({ icon: Icon, color = "teal" }: { icon: React.ComponentType<{ className?: string }>; color?: string }) => {
  const colorClasses = {
    teal: "bg-teal-500/20 text-teal-400 border-teal-500/40",
    cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/40",
    emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    amber: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    rose: "bg-rose-500/20 text-rose-400 border-rose-500/40",
  };
  return (
    <div className={`w-12 h-12 rounded-lg border flex items-center justify-center print:bg-gray-100 print:border-gray-300 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.teal}`}>
      <Icon className="h-6 w-6 print:text-gray-700" />
    </div>
  );
};

export default function Deck() {
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white print:bg-white print:text-black">
      {/* Navigation Bar - Hidden in Print */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-slate-950/95 backdrop-blur-sm border-b border-teal-500/30 print:hidden">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2 text-white hover:bg-slate-800 hover:text-teal-400">
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Home</span>
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
          <span className="text-sm text-teal-400 font-medium tracking-wide">STARTUP FACTORY HUB // PITCH DECK</span>
        </div>
        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 border-teal-500/50 text-teal-400 hover:bg-teal-500/10 hover:border-teal-500">
          <Printer className="h-4 w-4" />
          <span className="hidden sm:inline">Export PDF</span>
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="pt-16 print:pt-0">
        {/* SLIDE 1: Cover */}
        <SlideContainer>
          <div className="flex flex-col items-center text-center">
            {/* Logo with glow */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-teal-500/30 blur-3xl rounded-full print:hidden" />
              <img src={sfhLogo} alt="Startup Factory Hub" className="relative w-32 h-32 md:w-40 md:h-40 object-contain" />
              {/* Orbit ring */}
              <div className="absolute inset-[-20px] border border-dashed border-teal-500/40 rounded-full animate-spin print:hidden" style={{ animationDuration: '20s' }} />
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight print:text-black">
              Startup Factory Hub
            </h1>
            
            <p className="text-xl md:text-2xl font-semibold bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent mb-4 print:text-teal-700">
              AI-Powered Hybrid Acceleration Platform
            </p>
            
            <div className="flex items-center gap-3 text-lg md:text-xl text-slate-300 mb-8 print:text-gray-700">
              <span>From Idea</span>
              <ArrowRight className="h-5 w-5 text-teal-500" />
              <span>Product</span>
              <ArrowRight className="h-5 w-5 text-teal-500" />
              <span>Revenue</span>
              <ArrowRight className="h-5 w-5 text-teal-500" />
              <span>Capital</span>
            </div>
            
            <SectionDivider title="Infrastructure" />
            
            <p className="text-lg text-slate-400 max-w-2xl print:text-gray-600">
              Digital Infrastructure + Human Capital + Corporate & Investor Access
            </p>
          </div>
        </SlideContainer>

        {/* SLIDE 2: The Problem */}
        <SlideContainer>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4 mb-4">
              <IconBadge icon={Target} color="rose" />
              <h2 className="text-3xl md:text-4xl font-bold text-white print:text-black">The Problem</h2>
            </div>
            <p className="text-xl text-slate-400 text-center mb-12 print:text-gray-600">Fragmented Startup Ecosystem</p>
            
            <div className="grid gap-6 max-w-3xl w-full">
              <TechCard glowColor="rose">
                <div className="flex items-start gap-4">
                  <IconBadge icon={Search} color="rose" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-rose-400 print:text-rose-700">Limited Access</h3>
                    <p className="text-slate-300 print:text-gray-600">Startups struggle to find the right mentors, investors, and resources at critical stages.</p>
                  </div>
                </div>
              </TechCard>
              <TechCard glowColor="rose">
                <div className="flex items-start gap-4">
                  <IconBadge icon={Network} color="rose" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-rose-400 print:text-rose-700">Disconnected Networks</h3>
                    <p className="text-slate-300 print:text-gray-600">Investors miss quality deals, mentors can't reach promising founders efficiently.</p>
                  </div>
                </div>
              </TechCard>
              <TechCard glowColor="rose">
                <div className="flex items-start gap-4">
                  <IconBadge icon={BarChart3} color="rose" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-rose-400 print:text-rose-700">Lack of Structure</h3>
                    <p className="text-slate-300 print:text-gray-600">No unified platform for accelerators to manage cohorts and track startup progress.</p>
                  </div>
                </div>
              </TechCard>
            </div>
          </div>
        </SlideContainer>

        {/* SLIDE 3: Our Solution */}
        <SlideContainer>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4 mb-4">
              <IconBadge icon={Lightbulb} color="teal" />
              <h2 className="text-3xl md:text-4xl font-bold text-white print:text-black">Our Solution</h2>
            </div>
            <p className="text-xl text-slate-400 text-center mb-12 print:text-gray-600">All-in-One Innovation Platform</p>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl w-full">
              <TechCard glowColor="emerald">
                <div className="flex items-center gap-3 mb-4">
                  <IconBadge icon={Rocket} color="emerald" />
                  <h3 className="font-semibold text-lg text-emerald-400 print:text-emerald-700">For Startups</h3>
                </div>
                <ul className="space-y-2 text-slate-300 print:text-gray-600">
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-500" /> AI-powered mentor matching</li>
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-500" /> Investor network access</li>
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-500" /> Growth roadmap tracking</li>
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-500" /> Resource library & tools</li>
                </ul>
              </TechCard>
              <TechCard glowColor="purple">
                <div className="flex items-center gap-3 mb-4">
                  <IconBadge icon={Diamond} color="purple" />
                  <h3 className="font-semibold text-lg text-purple-400 print:text-purple-700">For Investors</h3>
                </div>
                <ul className="space-y-2 text-slate-300 print:text-gray-600">
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-purple-500" /> Curated deal flow</li>
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-purple-500" /> Portfolio management</li>
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-purple-500" /> Due diligence tools</li>
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-purple-500" /> Investment tracking</li>
                </ul>
              </TechCard>
              <TechCard glowColor="cyan">
                <div className="flex items-center gap-3 mb-4">
                  <IconBadge icon={Lightbulb} color="cyan" />
                  <h3 className="font-semibold text-lg text-cyan-400 print:text-cyan-700">For Mentors</h3>
                </div>
                <ul className="space-y-2 text-slate-300 print:text-gray-600">
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-cyan-500" /> Session scheduling</li>
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-cyan-500" /> Mentee management</li>
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-cyan-500" /> Impact tracking</li>
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-cyan-500" /> Endorsement system</li>
                </ul>
              </TechCard>
              <TechCard glowColor="amber">
                <div className="flex items-center gap-3 mb-4">
                  <IconBadge icon={Building2} color="amber" />
                  <h3 className="font-semibold text-lg text-amber-400 print:text-amber-700">For Accelerators</h3>
                </div>
                <ul className="space-y-2 text-slate-300 print:text-gray-600">
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" /> Cohort management</li>
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" /> Startup journey tracking</li>
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" /> Alumni portfolio</li>
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" /> Demo day organization</li>
                </ul>
              </TechCard>
            </div>
          </div>
        </SlideContainer>

        {/* SLIDE 4: Key Features */}
        <SlideContainer>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4 mb-4">
              <IconBadge icon={Cpu} color="teal" />
              <h2 className="text-3xl md:text-4xl font-bold text-white print:text-black">Key Features</h2>
            </div>
            <p className="text-xl text-slate-400 text-center mb-12 print:text-gray-600">Powered by Innovation</p>
            
            <div className="grid md:grid-cols-3 gap-4 max-w-5xl w-full">
              {[
                { icon: Cpu, title: "AI Recommendations", desc: "Smart matching algorithms for optimal connections", color: "teal" },
                { icon: Video, title: "Video Conferencing", desc: "Integrated virtual meetings and pitch sessions", color: "cyan" },
                { icon: FileText, title: "Document Suite", desc: "LightPaper productivity and collaboration tools", color: "purple" },
                { icon: Calendar, title: "Global Events", desc: "Networking opportunities and demo days", color: "emerald" },
                { icon: Briefcase, title: "Job Board", desc: "Talent acquisition and career opportunities", color: "amber" },
                { icon: BarChart3, title: "Market Intelligence", desc: "Real-time insights and analytics", color: "rose" },
              ].map((feature, i) => (
                <TechCard key={i} glowColor={feature.color} className="text-center">
                  <div className="flex justify-center mb-3">
                    <IconBadge icon={feature.icon} color={feature.color} />
                  </div>
                  <h4 className={`font-semibold text-${feature.color}-400 mb-2 print:text-gray-700`}>{feature.title}</h4>
                  <p className="text-sm text-slate-400 print:text-gray-600">{feature.desc}</p>
                </TechCard>
              ))}
            </div>
          </div>
        </SlideContainer>

        {/* SLIDE 5: Our Network */}
        <SlideContainer>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4 mb-4">
              <IconBadge icon={Users} color="teal" />
              <h2 className="text-3xl md:text-4xl font-bold text-white print:text-black">Our Network</h2>
            </div>
            <p className="text-xl text-slate-400 text-center mb-12 print:text-gray-600">Growing Global Community</p>
            
            <div className="grid md:grid-cols-4 gap-6 max-w-4xl w-full">
              {[
                { icon: Rocket, value: "500+", label: "Startups", color: "emerald" },
                { icon: Lightbulb, value: "150+", label: "Mentors", color: "cyan" },
                { icon: Diamond, value: "75+", label: "Investors", color: "purple" },
                { icon: Globe, value: "25+", label: "Countries", color: "amber" },
              ].map((stat, i) => (
                <TechCard key={i} glowColor={stat.color} className="text-center py-8">
                  <div className="flex justify-center mb-4">
                    <IconBadge icon={stat.icon} color={stat.color} />
                  </div>
                  <div className={`text-4xl md:text-5xl font-black bg-gradient-to-r from-${stat.color}-400 to-${stat.color}-300 bg-clip-text text-transparent mb-2`}>
                    {stat.value}
                  </div>
                  <div className="text-slate-400 font-medium print:text-gray-600">{stat.label}</div>
                </TechCard>
              ))}
            </div>
          </div>
        </SlideContainer>

        {/* SLIDE 6: Market Opportunity */}
        <SlideContainer>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4 mb-4">
              <IconBadge icon={TrendingUp} color="teal" />
              <h2 className="text-3xl md:text-4xl font-bold text-white print:text-black">Market Opportunity</h2>
            </div>
            <p className="text-xl text-slate-400 text-center mb-12 print:text-gray-600">$25B+ Global Accelerator Market</p>
            
            <div className="max-w-3xl w-full space-y-6">
              <TechCard glowColor="teal">
                <h3 className="font-semibold text-lg mb-4 text-teal-400 flex items-center gap-2 print:text-teal-700">
                  <TrendingUp className="h-5 w-5" /> Growth Drivers
                </h3>
                <ul className="space-y-4 text-slate-300 print:text-gray-600">
                  <li className="flex items-center gap-4">
                    <IconBadge icon={TrendingUp} color="emerald" />
                    <span>15% CAGR in startup ecosystem growth</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <IconBadge icon={Globe} color="cyan" />
                    <span>Increasing global entrepreneurship</span>
                  </li>
                  <li className="flex items-center gap-4">
                    <IconBadge icon={Cpu} color="purple" />
                    <span>Digital transformation of business support</span>
                  </li>
                </ul>
              </TechCard>
              <TechCard glowColor="cyan">
                <h3 className="font-semibold text-lg mb-2 text-cyan-400 flex items-center gap-2 print:text-cyan-700">
                  <Globe className="h-5 w-5" /> Target Markets
                </h3>
                <p className="text-slate-300 print:text-gray-600">North America, Europe, Asia-Pacific, Latin America, Middle East & Africa</p>
              </TechCard>
            </div>
          </div>
        </SlideContainer>

        {/* SLIDE 7: Business Model */}
        <SlideContainer>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-4 mb-4">
              <IconBadge icon={DollarSign} color="emerald" />
              <h2 className="text-3xl md:text-4xl font-bold text-white print:text-black">Business Model</h2>
            </div>
            <p className="text-xl text-slate-400 text-center mb-12 print:text-gray-600">Sustainable Revenue Streams</p>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl w-full">
              <TechCard glowColor="emerald">
                <h3 className="font-semibold text-lg mb-4 text-emerald-400 flex items-center gap-2 print:text-emerald-700">
                  <Award className="h-5 w-5" /> Subscription Tiers
                </h3>
                <ul className="space-y-3 text-slate-300 print:text-gray-600">
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-500" /> Free tier for startups</li>
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-500" /> Premium for advanced features</li>
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-500" /> Enterprise for accelerators</li>
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-500" /> Investor Pro access</li>
                </ul>
              </TechCard>
              <TechCard glowColor="purple">
                <h3 className="font-semibold text-lg mb-4 text-purple-400 flex items-center gap-2 print:text-purple-700">
                  <Handshake className="h-5 w-5" /> Additional Revenue
                </h3>
                <ul className="space-y-3 text-slate-300 print:text-gray-600">
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-purple-500" /> Cohort enrollment fees</li>
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-purple-500" /> Success-based commissions</li>
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-purple-500" /> Corporate partnerships</li>
                  <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-purple-500" /> Sponsored events</li>
                </ul>
              </TechCard>
            </div>
          </div>
        </SlideContainer>

        {/* SLIDE 8: Contact */}
        <SlideContainer className="print:break-after-avoid">
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-4 mb-4">
              <IconBadge icon={Rocket} color="teal" />
              <h2 className="text-3xl md:text-4xl font-bold text-white print:text-black">Join Our Mission</h2>
            </div>
            <p className="text-xl text-slate-400 mb-8 print:text-gray-600">Let's Build the Future Together</p>
            
            <p className="text-lg text-slate-400 max-w-2xl mb-8 print:text-gray-600">
              We're looking for partners, investors, and innovators who share our vision of democratizing access to startup success.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center mb-8">
              <a 
                href="mailto:contact@startupfactoryhub.com" 
                className="inline-flex items-center gap-3 bg-slate-900/80 border-2 border-teal-500/40 rounded-lg px-6 py-3 hover:border-teal-500/60 transition-colors print:bg-white print:border-gray-300"
              >
                <Mail className="h-5 w-5 text-teal-400 print:text-gray-700" />
                <span className="text-slate-200 font-medium print:text-gray-700">contact@startupfactoryhub.com</span>
              </a>
              <a 
                href="https://startupfactoryhub.lovable.app" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-3 bg-slate-900/80 border-2 border-cyan-500/40 rounded-lg px-6 py-3 hover:border-cyan-500/60 transition-colors print:bg-white print:border-gray-300"
              >
                <ExternalLink className="h-5 w-5 text-cyan-400 print:text-gray-700" />
                <span className="text-slate-200 font-medium print:text-gray-700">startupfactoryhub.lovable.app</span>
              </a>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-teal-500/20 blur-2xl rounded-full print:hidden" />
              <img src={sfhLogo} alt="Startup Factory Hub" className="relative w-24 h-24 object-contain" />
            </div>
            
            <p className="text-sm text-slate-600 mt-8 print:text-gray-400">© 2025 Startup Factory Hub. All rights reserved.</p>
          </div>
        </SlideContainer>
      </div>
    </div>
  );
}
