import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { FileText, AlertTriangle, UserX, Scale, Shield } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-primary/20 mb-6">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 tracking-wide">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                TERMS OF SERVICE
              </span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Last updated: November 18, 2025
            </p>
          </div>

          {/* Content */}
          <div className="glass-card p-8 sm:p-12 rounded-xl border border-ocean-border space-y-8">
            
            {/* Acceptance */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using Startup Factory Hub ("the Platform"), you agree to be bound by these Terms of 
                Service ("Terms"). If you do not agree to these Terms, you may not access or use the Platform. 
                These Terms apply to all users, including startups, mentors, investors, advisors, and students.
              </p>
            </section>

            {/* Account Registration */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <UserX className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">2. Account Registration and Security</h2>
              </div>
              
              <h3 className="text-xl font-semibold mb-3 text-foreground">Registration Requirements</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To use certain features of the Platform, you must:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Be at least 13 years of age</li>
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information to keep it accurate</li>
                <li>Choose a role that accurately represents your position (Startup, Mentor, Investor, Advisor, or Student)</li>
                <li>Not use the Platform for any illegal or unauthorized purpose</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">Account Security</h3>
              <p className="text-muted-foreground leading-relaxed">
                You are responsible for maintaining the confidentiality of your account credentials and for all 
                activities that occur under your account. You agree to notify us immediately of any unauthorized 
                use of your account.
              </p>
            </section>

            {/* User Conduct */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">3. User Conduct and Prohibited Activities</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You agree not to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Violate any applicable laws, regulations, or third-party rights</li>
                <li>Post false, misleading, or fraudulent information</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Impersonate any person or entity</li>
                <li>Spam, solicit, or engage in unauthorized advertising</li>
                <li>Upload viruses, malware, or any harmful code</li>
                <li>Attempt to gain unauthorized access to the Platform or user accounts</li>
                <li>Scrape, crawl, or use automated tools to access the Platform</li>
                <li>Interfere with or disrupt the Platform's functionality</li>
                <li>Misuse AI features for harmful or unethical purposes</li>
              </ul>
            </section>

            {/* Content Ownership */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Scale className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">4. Content and Intellectual Property</h2>
              </div>
              
              <h3 className="text-xl font-semibold mb-3 text-foreground">Your Content</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You retain ownership of all content you post on the Platform, including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Profile information and company descriptions</li>
                <li>Pitch decks and business documents</li>
                <li>Posts, comments, and messages</li>
                <li>Educational materials and resources</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                By posting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, 
                modify, distribute, and display your content in connection with operating and improving the Platform.
              </p>

              <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">Platform Content</h3>
              <p className="text-muted-foreground leading-relaxed">
                The Platform and its original content, features, and functionality are owned by Startup Factory Hub 
                and are protected by international copyright, trademark, patent, trade secret, and other intellectual 
                property laws.
              </p>
            </section>

            {/* Services */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">5. Platform Services</h2>
              
              <h3 className="text-xl font-semibold mb-3 text-foreground">Available Features</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our Platform provides various features including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>AI-powered matching and recommendations</li>
                <li>Mentorship and advisory services</li>
                <li>Investor networking and pitch opportunities</li>
                <li>Job and internship boards</li>
                <li>Educational resources and courses</li>
                <li>Collaboration tools (LightPaper, messaging, video conferencing)</li>
                <li>Community feed and networking</li>
                <li>Document analysis and AI assistance</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">Service Availability</h3>
              <p className="text-muted-foreground leading-relaxed">
                We strive to maintain the Platform's availability but do not guarantee uninterrupted access. 
                We reserve the right to modify, suspend, or discontinue any feature at any time without notice.
              </p>
            </section>

            {/* Payments */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">6. Payments and Subscriptions</h2>
              <p className="text-muted-foreground leading-relaxed">
                Certain features may require payment. By purchasing a subscription or service, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mt-4">
                <li>Provide accurate billing information</li>
                <li>Pay all applicable fees and charges</li>
                <li>Authorize recurring charges (for subscriptions)</li>
                <li>Accept our refund policy as stated in your subscription agreement</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                All fees are non-refundable unless otherwise specified or required by law.
              </p>
            </section>

            {/* Privacy */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">7. Privacy and Data Protection</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Your use of the Platform is also governed by our{" "}
                <a href="/privacy-policy" className="text-primary hover:underline">Privacy Policy</a>, 
                which explains how we collect, use, and protect your personal information. By using the Platform, 
                you consent to our data practices as described in the Privacy Policy.
              </p>
            </section>

            {/* Disclaimers */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">8. Disclaimers and Warranties</h2>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6">
                <p className="text-muted-foreground leading-relaxed mb-4">
                  <strong className="text-foreground">IMPORTANT:</strong> The Platform is provided "AS IS" and 
                  "AS AVAILABLE" without warranties of any kind, either express or implied.
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>We do not guarantee the accuracy or completeness of any content</li>
                  <li>We do not endorse any startup, mentor, investor, or opportunity</li>
                  <li>AI-generated recommendations and matches are automated and may not be perfect</li>
                  <li>Users are responsible for their own due diligence in all transactions and relationships</li>
                  <li>We are not responsible for interactions between users</li>
                </ul>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">9. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                To the maximum extent permitted by law, Startup Factory Hub and its affiliates, officers, 
                directors, employees, and agents shall not be liable for any indirect, incidental, special, 
                consequential, or punitive damages, including but not limited to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mt-4">
                <li>Loss of profits, revenue, or data</li>
                <li>Business interruption or loss of opportunity</li>
                <li>Investments made based on Platform recommendations</li>
                <li>Failed partnerships, mentorships, or business relationships</li>
              </ul>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">10. Indemnification</h2>
              <p className="text-muted-foreground leading-relaxed">
                You agree to indemnify, defend, and hold harmless Startup Factory Hub and its affiliates from 
                any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mt-4">
                <li>Your use of the Platform</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any rights of another party</li>
                <li>Your content posted on the Platform</li>
              </ul>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">11. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to suspend or terminate your account and access to the Platform at any time, 
                with or without cause, and with or without notice. Reasons for termination may include:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mt-4">
                <li>Violation of these Terms</li>
                <li>Fraudulent or illegal activity</li>
                <li>Harassment or abuse of other users</li>
                <li>Extended period of inactivity</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                You may terminate your account at any time through your account settings.
              </p>
            </section>

            {/* Dispute Resolution */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">12. Dispute Resolution</h2>
              <p className="text-muted-foreground leading-relaxed">
                Any disputes arising from these Terms or your use of the Platform shall be resolved through 
                binding arbitration in accordance with the rules of the American Arbitration Association. 
                You waive your right to participate in class action lawsuits.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">13. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the State of 
                California, United States, without regard to its conflict of law provisions.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">14. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify users of any material 
                changes by posting the new Terms on the Platform and updating the "Last updated" date. Your 
                continued use of the Platform after changes constitutes acceptance of the modified Terms.
              </p>
            </section>

            {/* Severability */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">15. Severability</h2>
              <p className="text-muted-foreground leading-relaxed">
                If any provision of these Terms is found to be unenforceable or invalid, that provision shall 
                be limited or eliminated to the minimum extent necessary, and the remaining provisions shall 
                remain in full force and effect.
              </p>
            </section>

            {/* Contact */}
            <section className="bg-ocean-dark/30 p-6 rounded-lg border border-ocean-border">
              <h2 className="text-2xl font-bold mb-4 text-foreground">16. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you have any questions about these Terms, please contact us:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li><strong>Email:</strong> legal@startupfactoryhub.com</li>
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

export default TermsOfService;
