import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MatrixBackground from "@/components/MatrixBackground";
import { Cookie, Settings, BarChart, Shield, Eye } from "lucide-react";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <MatrixBackground />
      <Navigation />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-primary/20 mb-6">
              <Cookie className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 tracking-wide">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                COOKIE POLICY
              </span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Last updated: November 18, 2025
            </p>
          </div>

          {/* Content */}
          <div className="glass-card p-8 sm:p-12 rounded-xl border border-ocean-border space-y-8">
            
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">What Are Cookies?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files that are placed on your device (computer, smartphone, or tablet) 
                when you visit websites. They are widely used to make websites work more efficiently and provide 
                information to website owners. This Cookie Policy explains what cookies are, how we use them on 
                Startup Factory Hub, and how you can manage your cookie preferences.
              </p>
            </section>

            {/* Why We Use Cookies */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Eye className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Why We Use Cookies</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Keep you signed in to your account</li>
                <li>Remember your preferences and settings</li>
                <li>Understand how you use our platform</li>
                <li>Improve our services and user experience</li>
                <li>Provide personalized content and recommendations</li>
                <li>Measure the effectiveness of our features</li>
                <li>Ensure the security of our platform</li>
                <li>Enable social media features and integrations</li>
              </ul>
            </section>

            {/* Types of Cookies */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Cookie className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Types of Cookies We Use</h2>
              </div>

              {/* Essential Cookies */}
              <div className="space-y-4">
                <div className="bg-ocean-dark/30 p-6 rounded-lg border border-ocean-border">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold text-foreground">Essential Cookies (Required)</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    These cookies are necessary for the platform to function properly and cannot be disabled.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 text-sm">
                    <li><strong>Authentication:</strong> Keep you logged in to your account</li>
                    <li><strong>Security:</strong> Protect against fraudulent activity and secure your data</li>
                    <li><strong>Session management:</strong> Remember your actions during a browsing session</li>
                    <li><strong>Load balancing:</strong> Distribute network traffic for optimal performance</li>
                  </ul>
                </div>

                <div className="bg-ocean-dark/30 p-6 rounded-lg border border-ocean-border">
                  <div className="flex items-center gap-3 mb-3">
                    <BarChart className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold text-foreground">Analytics Cookies (Optional)</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    These cookies help us understand how visitors interact with our platform.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 text-sm">
                    <li><strong>Usage tracking:</strong> Which features are most popular</li>
                    <li><strong>Performance monitoring:</strong> How fast pages load</li>
                    <li><strong>Error tracking:</strong> Identify and fix technical issues</li>
                    <li><strong>User behavior:</strong> Navigation patterns and click behavior</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-3">
                    <strong>Third-party services:</strong> Google Analytics, Supabase Analytics
                  </p>
                </div>

                <div className="bg-ocean-dark/30 p-6 rounded-lg border border-ocean-border">
                  <div className="flex items-center gap-3 mb-3">
                    <Settings className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold text-foreground">Functional Cookies (Optional)</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    These cookies enable enhanced functionality and personalization.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 text-sm">
                    <li><strong>Preferences:</strong> Remember your settings (theme, language, layout)</li>
                    <li><strong>Personalization:</strong> Customize content based on your role and interests</li>
                    <li><strong>AI recommendations:</strong> Improve matching accuracy over time</li>
                    <li><strong>Video conferencing:</strong> Enable Whereby meeting functionality</li>
                  </ul>
                </div>

                <div className="bg-ocean-dark/30 p-6 rounded-lg border border-ocean-border">
                  <div className="flex items-center gap-3 mb-3">
                    <Eye className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold text-foreground">Marketing Cookies (Optional)</h3>
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-3">
                    These cookies track your activity to deliver relevant advertising.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 text-sm">
                    <li><strong>Targeted advertising:</strong> Show relevant ads based on your interests</li>
                    <li><strong>Social media:</strong> Enable sharing and social features</li>
                    <li><strong>Campaign tracking:</strong> Measure marketing effectiveness</li>
                    <li><strong>Retargeting:</strong> Show ads after you leave our platform</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-3">
                    <strong>Third-party services:</strong> Google Ads, LinkedIn Ads, Facebook Pixel
                  </p>
                </div>
              </div>
            </section>

            {/* Third-Party Cookies */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">Third-Party Cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use services from trusted third-party providers that may set their own cookies:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong>Supabase:</strong> Authentication, database, and analytics</li>
                <li><strong>Google Services:</strong> Analytics, authentication, and advertising</li>
                <li><strong>Whereby:</strong> Video conferencing functionality</li>
                <li><strong>Social Media Platforms:</strong> LinkedIn, Twitter, Facebook integration</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                These third parties have their own privacy policies, and we encourage you to review them.
              </p>
            </section>

            {/* Managing Cookies */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Settings className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">How to Manage Cookies</h2>
              </div>
              
              <h3 className="text-xl font-semibold mb-3 text-foreground">Browser Settings</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Most web browsers allow you to control cookies through their settings. You can:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>View what cookies have been set</li>
                <li>Block third-party cookies</li>
                <li>Block cookies from specific websites</li>
                <li>Block all cookies</li>
                <li>Delete cookies when you close your browser</li>
                <li>Delete all cookies</li>
              </ul>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6 mt-6">
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Important:</strong> Blocking or deleting cookies may 
                  impact your experience on our platform. Essential features like authentication may not work 
                  properly if you disable all cookies.
                </p>
              </div>

              <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">Browser-Specific Instructions</h3>
              <ul className="space-y-2 text-muted-foreground ml-4">
                <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
                <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
                <li><strong>Edge:</strong> Settings → Cookies and site permissions → Manage and delete cookies</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">Opt-Out Options</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You can opt out of certain cookies:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Analytics Opt-out</a></li>
                <li><a href="https://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Network Advertising Initiative Opt-out</a></li>
                <li><a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Digital Advertising Alliance Opt-out</a></li>
              </ul>
            </section>

            {/* Do Not Track */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">Do Not Track Signals</h2>
              <p className="text-muted-foreground leading-relaxed">
                Some browsers include a "Do Not Track" (DNT) feature that signals to websites that you do not 
                want to be tracked. Currently, there is no industry standard for how to respond to DNT signals. 
                We do not currently respond to DNT signals, but we respect your privacy choices and provide 
                cookie management options as described above.
              </p>
            </section>

            {/* Cookie Duration */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">How Long Do Cookies Last?</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">Session Cookies</h3>
                  <p className="text-muted-foreground">
                    These are temporary cookies that expire when you close your browser.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">Persistent Cookies</h3>
                  <p className="text-muted-foreground">
                    These remain on your device until they expire or you delete them. Duration varies from 
                    a few days to several years, depending on their purpose.
                  </p>
                </div>
              </div>
            </section>

            {/* Updates */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">Changes to This Cookie Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for 
                other operational, legal, or regulatory reasons. We encourage you to review this policy 
                periodically. The "Last updated" date at the top indicates when this policy was last revised.
              </p>
            </section>

            {/* More Information */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">More Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                For more information about how we process your personal data, please see our{" "}
                <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
                For questions about our use of cookies and other tracking technologies, please refer to the 
                contact information below.
              </p>
            </section>

            {/* Contact */}
            <section className="bg-ocean-dark/30 p-6 rounded-lg border border-ocean-border">
              <h2 className="text-2xl font-bold mb-4 text-foreground">Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you have any questions about our use of cookies, please contact us:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Email:</strong> privacy@startupfactoryhub.com</li>
                <li><strong>Support:</strong> support@startupfactoryhub.com</li>
              </ul>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CookiePolicy;
