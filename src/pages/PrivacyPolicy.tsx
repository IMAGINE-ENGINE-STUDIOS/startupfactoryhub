import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Shield, Eye, Lock, UserCheck, Database, Mail } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-primary/20 mb-6">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 tracking-wide">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                PRIVACY POLICY
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
              <h2 className="text-2xl font-bold mb-4 text-foreground">Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                At Startup Factory Hub, we take your privacy seriously. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our platform. Please read this privacy 
                policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Database className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Information We Collect</h2>
              </div>
              
              <h3 className="text-xl font-semibold mb-3 text-foreground">Personal Information</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We collect information that you provide directly to us when you:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Create an account (name, email, password, role)</li>
                <li>Complete your profile (bio, expertise, company information)</li>
                <li>Upload documents, pitch decks, or resumes</li>
                <li>Participate in mentorship sessions or investor meetings</li>
                <li>Post content, comments, or messages</li>
                <li>Apply for jobs or internships</li>
                <li>Contact customer support</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">Automatically Collected Information</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When you access our platform, we automatically collect:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage data (pages viewed, time spent, click patterns)</li>
                <li>Location information (with your permission)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <UserCheck className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">How We Use Your Information</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Provide, operate, and maintain our platform</li>
                <li>Match you with relevant mentors, investors, and opportunities</li>
                <li>Process your applications and transactions</li>
                <li>Send you notifications, updates, and marketing communications</li>
                <li>Analyze platform usage and improve our services</li>
                <li>Detect, prevent, and address technical issues or fraudulent activity</li>
                <li>Comply with legal obligations</li>
                <li>Facilitate collaboration and community features</li>
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Lock className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Data Security</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your personal 
                information against unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mt-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and audits</li>
                <li>Access controls and authentication protocols</li>
                <li>Secure data storage with Supabase infrastructure</li>
                <li>Regular backups and disaster recovery procedures</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Eye className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Information Sharing and Disclosure</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We may share your information in the following circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong>With your consent:</strong> When you explicitly authorize us to share your information</li>
                <li><strong>With other users:</strong> Profile information visible to other community members</li>
                <li><strong>Service providers:</strong> Third-party vendors who help us operate our platform</li>
                <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">Your Privacy Rights</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You have the following rights regarding your personal information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Restrict processing:</strong> Limit how we use your data</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                To exercise these rights, please contact us at{" "}
                <a href="mailto:privacy@startupfactoryhub.com" className="text-primary hover:underline">
                  privacy@startupfactoryhub.com
                </a>
              </p>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">Cookies and Tracking</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar tracking technologies to enhance your experience on our platform. 
                You can control cookie preferences through your browser settings. For more information, 
                please see our{" "}
                <a href="/cookie-policy" className="text-primary hover:underline">Cookie Policy</a>.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our platform is not intended for children under 13 years of age. We do not knowingly collect 
                personal information from children under 13. If you are a parent or guardian and believe we 
                have collected information from your child, please contact us immediately.
              </p>
            </section>

            {/* International Users */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">International Data Transfers</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. 
                We ensure appropriate safeguards are in place to protect your data in accordance with 
                this Privacy Policy and applicable data protection laws.
              </p>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className="text-2xl font-bold mb-4 text-foreground">Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by 
                posting the new Privacy Policy on this page and updating the "Last updated" date. You are 
                advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            {/* Contact */}
            <section className="bg-ocean-dark/30 p-6 rounded-lg border border-ocean-border">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">Contact Us</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                If you have any questions about this Privacy Policy, please contact us:
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

export default PrivacyPolicy;
