import { Home, Rocket, Target, Users, Lightbulb, TrendingUp, Globe, Award, Mail, ExternalLink, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import sfhLogo from '@/assets/sfh-logo-sphere.png';

export default function Deck() {
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white text-black print:bg-white">
      {/* Navigation Bar - Hidden in Print */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur-sm border-b border-gray-200 print:hidden">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2 text-black hover:bg-gray-100">
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Home</span>
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Startup Factory Hub - Pitch Deck</span>
        </div>
        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 border-gray-300 text-black hover:bg-gray-100">
          <Printer className="h-4 w-4" />
          <span className="hidden sm:inline">Print / Export PDF</span>
        </Button>
      </div>

      {/* Scrollable Content */}
      <div className="pt-20 print:pt-0">
        {/* Section 1: Cover */}
        <section className="min-h-screen flex flex-col items-center justify-center p-8 md:p-16 print:min-h-0 print:py-16 print:break-after-page border-b border-gray-200">
          <img src={sfhLogo} alt="Startup Factory Hub" className="w-32 h-32 md:w-40 md:h-40 object-contain mb-8" />
          <h1 className="text-4xl md:text-6xl font-bold text-center text-black mb-4">
            Startup Factory Hub
          </h1>
          <p className="text-xl md:text-2xl text-blue-600 font-semibold text-center mb-4">
            AI-Powered Hybrid Acceleration Platform
          </p>
          <p className="text-lg md:text-xl text-gray-700 text-center mb-8 font-medium">
            From Idea → Product → Revenue → Capital
          </p>
          <div className="border-t-2 border-gray-200 pt-6 mt-2">
            <p className="text-lg text-gray-500 text-center max-w-2xl">
              Digital Infrastructure + Human Capital + Corporate & Investor Access
            </p>
          </div>
        </section>

        {/* Section 2: The Problem */}
        <section className="min-h-screen flex flex-col items-center justify-center p-8 md:p-16 print:min-h-0 print:py-16 print:break-after-page border-b border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <Target className="h-8 w-8 text-red-600" />
            <h2 className="text-3xl md:text-4xl font-bold text-black">The Problem</h2>
          </div>
          <p className="text-xl text-gray-600 text-center mb-12">Fragmented Startup Ecosystem</p>
          
          <div className="grid gap-6 max-w-3xl w-full">
            <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50 print:bg-white print:border-gray-300">
              <h3 className="font-semibold text-lg mb-2 text-red-600">🔍 Limited Access</h3>
              <p className="text-gray-600">Startups struggle to find the right mentors, investors, and resources at critical stages.</p>
            </div>
            <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50 print:bg-white print:border-gray-300">
              <h3 className="font-semibold text-lg mb-2 text-red-600">🌐 Disconnected Networks</h3>
              <p className="text-gray-600">Investors miss quality deals, mentors can't reach promising founders efficiently.</p>
            </div>
            <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50 print:bg-white print:border-gray-300">
              <h3 className="font-semibold text-lg mb-2 text-red-600">📊 Lack of Structure</h3>
              <p className="text-gray-600">No unified platform for accelerators to manage cohorts and track startup progress.</p>
            </div>
          </div>
        </section>

        {/* Section 3: Our Solution */}
        <section className="min-h-screen flex flex-col items-center justify-center p-8 md:p-16 print:min-h-0 print:py-16 print:break-after-page border-b border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="h-8 w-8 text-blue-600" />
            <h2 className="text-3xl md:text-4xl font-bold text-black">Our Solution</h2>
          </div>
          <p className="text-xl text-gray-600 text-center mb-12">All-in-One Innovation Platform</p>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl w-full">
            <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50 print:bg-white print:border-gray-300">
              <h3 className="font-semibold text-lg mb-4 text-blue-700">For Startups</h3>
              <ul className="space-y-2 text-gray-600">
                <li>✓ AI-powered mentor matching</li>
                <li>✓ Investor network access</li>
                <li>✓ Growth roadmap tracking</li>
                <li>✓ Resource library & tools</li>
              </ul>
            </div>
            <div className="border-2 border-purple-200 rounded-lg p-6 bg-purple-50 print:bg-white print:border-gray-300">
              <h3 className="font-semibold text-lg mb-4 text-purple-700">For Investors</h3>
              <ul className="space-y-2 text-gray-600">
                <li>✓ Curated deal flow</li>
                <li>✓ Portfolio management</li>
                <li>✓ Due diligence tools</li>
                <li>✓ Investment tracking</li>
              </ul>
            </div>
            <div className="border-2 border-green-200 rounded-lg p-6 bg-green-50 print:bg-white print:border-gray-300">
              <h3 className="font-semibold text-lg mb-4 text-green-700">For Mentors</h3>
              <ul className="space-y-2 text-gray-600">
                <li>✓ Session scheduling</li>
                <li>✓ Mentee management</li>
                <li>✓ Impact tracking</li>
                <li>✓ Endorsement system</li>
              </ul>
            </div>
            <div className="border-2 border-orange-200 rounded-lg p-6 bg-orange-50 print:bg-white print:border-gray-300">
              <h3 className="font-semibold text-lg mb-4 text-orange-700">For Accelerators</h3>
              <ul className="space-y-2 text-gray-600">
                <li>✓ Cohort management</li>
                <li>✓ Startup journey tracking</li>
                <li>✓ Alumni portfolio</li>
                <li>✓ Demo day organization</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 4: Key Features */}
        <section className="min-h-screen flex flex-col items-center justify-center p-8 md:p-16 print:min-h-0 print:py-16 print:break-after-page border-b border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <Award className="h-8 w-8 text-blue-600" />
            <h2 className="text-3xl md:text-4xl font-bold text-black">Key Features</h2>
          </div>
          <p className="text-xl text-gray-600 text-center mb-12">Powered by Innovation</p>
          
          <div className="grid md:grid-cols-3 gap-4 max-w-5xl w-full">
            {[
              { title: "AI Recommendations", desc: "Smart matching algorithms for optimal connections" },
              { title: "Video Conferencing", desc: "Integrated virtual meetings and pitch sessions" },
              { title: "Document Suite", desc: "LightPaper productivity and collaboration tools" },
              { title: "Global Events", desc: "Networking opportunities and demo days" },
              { title: "Job Board", desc: "Talent acquisition and career opportunities" },
              { title: "Market Intelligence", desc: "Real-time insights and analytics" },
            ].map((feature, i) => (
              <div key={i} className="border-2 border-gray-200 rounded-lg p-6 text-center bg-gray-50 print:bg-white print:border-gray-300">
                <h4 className="font-semibold text-blue-700 mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Our Network */}
        <section className="min-h-screen flex flex-col items-center justify-center p-8 md:p-16 print:min-h-0 print:py-16 print:break-after-page border-b border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <Users className="h-8 w-8 text-blue-600" />
            <h2 className="text-3xl md:text-4xl font-bold text-black">Our Network</h2>
          </div>
          <p className="text-xl text-gray-600 text-center mb-12">Growing Global Community</p>
          
          <div className="grid md:grid-cols-4 gap-8 max-w-4xl w-full text-center">
            <div className="border-2 border-blue-200 rounded-lg p-8 bg-blue-50 print:bg-white print:border-gray-300">
              <div className="text-5xl font-bold text-blue-700 mb-2">500+</div>
              <div className="text-gray-600 font-medium">Startups</div>
            </div>
            <div className="border-2 border-purple-200 rounded-lg p-8 bg-purple-50 print:bg-white print:border-gray-300">
              <div className="text-5xl font-bold text-purple-700 mb-2">150+</div>
              <div className="text-gray-600 font-medium">Mentors</div>
            </div>
            <div className="border-2 border-green-200 rounded-lg p-8 bg-green-50 print:bg-white print:border-gray-300">
              <div className="text-5xl font-bold text-green-700 mb-2">75+</div>
              <div className="text-gray-600 font-medium">Investors</div>
            </div>
            <div className="border-2 border-orange-200 rounded-lg p-8 bg-orange-50 print:bg-white print:border-gray-300">
              <div className="text-5xl font-bold text-orange-700 mb-2">25+</div>
              <div className="text-gray-600 font-medium">Countries</div>
            </div>
          </div>
        </section>

        {/* Section 6: Market Opportunity */}
        <section className="min-h-screen flex flex-col items-center justify-center p-8 md:p-16 print:min-h-0 print:py-16 print:break-after-page border-b border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <h2 className="text-3xl md:text-4xl font-bold text-black">Market Opportunity</h2>
          </div>
          <p className="text-xl text-gray-600 text-center mb-12">$25B+ Global Accelerator Market</p>
          
          <div className="max-w-3xl w-full space-y-6">
            <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50 print:bg-white print:border-gray-300">
              <h3 className="font-semibold text-lg mb-4 text-blue-700">Growth Drivers</h3>
              <ul className="space-y-4 text-gray-600">
                <li className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <span>15% CAGR in startup ecosystem growth</span>
                </li>
                <li className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-purple-600 flex-shrink-0" />
                  <span>Increasing global entrepreneurship</span>
                </li>
                <li className="flex items-center gap-3">
                  <Lightbulb className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Digital transformation of business support</span>
                </li>
              </ul>
            </div>
            <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50 print:bg-white print:border-gray-300">
              <h3 className="font-semibold text-lg mb-2 text-blue-700">Target Markets</h3>
              <p className="text-gray-600">North America, Europe, Asia-Pacific, Latin America, Middle East & Africa</p>
            </div>
          </div>
        </section>

        {/* Section 7: Business Model */}
        <section className="min-h-screen flex flex-col items-center justify-center p-8 md:p-16 print:min-h-0 print:py-16 print:break-after-page border-b border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <Award className="h-8 w-8 text-blue-600" />
            <h2 className="text-3xl md:text-4xl font-bold text-black">Business Model</h2>
          </div>
          <p className="text-xl text-gray-600 text-center mb-12">Sustainable Revenue Streams</p>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl w-full">
            <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50 print:bg-white print:border-gray-300">
              <h3 className="font-semibold text-lg mb-4 text-blue-700">Subscription Tiers</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Free tier for startups</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Premium for advanced features</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Enterprise for accelerators</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Investor Pro access</span>
                </li>
              </ul>
            </div>
            <div className="border-2 border-purple-200 rounded-lg p-6 bg-purple-50 print:bg-white print:border-gray-300">
              <h3 className="font-semibold text-lg mb-4 text-purple-700">Additional Revenue</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Cohort enrollment fees</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Success-based commissions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Corporate partnerships</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>Sponsored events</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 8: Contact */}
        <section className="min-h-screen flex flex-col items-center justify-center p-8 md:p-16 print:min-h-0 print:py-16">
          <div className="flex items-center gap-3 mb-6">
            <Rocket className="h-8 w-8 text-blue-600" />
            <h2 className="text-3xl md:text-4xl font-bold text-black">Join Our Mission</h2>
          </div>
          <p className="text-xl text-gray-600 text-center mb-8">Let's Build the Future Together</p>
          
          <div className="flex flex-col items-center gap-8 max-w-2xl text-center">
            <p className="text-lg text-gray-500">
              We're looking for partners, investors, and innovators who share our vision of democratizing access to startup success.
            </p>
            <div className="flex flex-wrap gap-4 justify-center print:flex-col">
              <a 
                href="mailto:contact@startupfactoryhub.com" 
                className="inline-flex items-center gap-2 border-2 border-blue-200 rounded-lg px-6 py-3 bg-blue-50 hover:bg-blue-100 transition-colors print:bg-white print:border-gray-300"
              >
                <Mail className="h-5 w-5 text-blue-600" />
                <span className="text-gray-700 font-medium">contact@startupfactoryhub.com</span>
              </a>
              <a 
                href="https://startupfactoryhub.lovable.app" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 border-2 border-purple-200 rounded-lg px-6 py-3 bg-purple-50 hover:bg-purple-100 transition-colors print:bg-white print:border-gray-300"
              >
                <ExternalLink className="h-5 w-5 text-purple-600" />
                <span className="text-gray-700 font-medium">startupfactoryhub.lovable.app</span>
              </a>
            </div>
            <img src={sfhLogo} alt="Startup Factory Hub" className="w-24 h-24 object-contain mt-8" />
            <p className="text-sm text-gray-400 mt-4">© 2025 Startup Factory Hub. All rights reserved.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
