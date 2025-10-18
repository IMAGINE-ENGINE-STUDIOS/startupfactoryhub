import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";

interface WelcomeEmailProps {
  app_url: string;
  user_email: string;
}

export const WelcomeEmail = ({
  app_url,
  user_email,
}: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>🚀 Welcome to Startup Factory Hub - Your Innovation Journey Starts Now!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <div style={logo}>🚀</div>
          <Heading style={h1}>Startup Factory Hub</Heading>
          <Text style={tagline}>AI-Powered Startup Accelerator Platform</Text>
        </Section>

        <Section style={heroSection}>
          <div style={heroIcon}>🎉</div>
          <Heading style={h2}>Welcome to the Future!</Heading>
          <Text style={heroText}>
            Your journey as an innovator begins here
          </Text>
        </Section>

        <Section style={content}>
          <div style={card}>
            <Text style={welcomeText}>
              Hi there! 👋<br /><br />
              We're thrilled to welcome you to <strong>Startup Factory Hub</strong>, where innovation meets opportunity. You've just joined a vibrant community of entrepreneurs, investors, mentors, and students building the next generation of successful startups.
            </Text>

            <div style={featuresGrid}>
              <div style={featureItem}>
                <div style={featureIcon}>🤝</div>
                <Text style={featureTitle}>Connect & Network</Text>
                <Text style={featureText}>
                  Find mentors, investors, and fellow entrepreneurs who share your vision
                </Text>
              </div>

              <div style={featureItem}>
                <div style={featureIcon}>💼</div>
                <Text style={featureTitle}>Opportunities</Text>
                <Text style={featureText}>
                  Discover jobs, internships, and partnership opportunities
                </Text>
              </div>

              <div style={featureItem}>
                <div style={featureIcon}>🎓</div>
                <Text style={featureTitle}>Learn & Grow</Text>
                <Text style={featureText}>
                  Access exclusive courses, resources, and industry insights
                </Text>
              </div>

              <div style={featureItem}>
                <div style={featureIcon}>🤖</div>
                <Text style={featureTitle}>AI-Powered</Text>
                <Text style={featureText}>
                  Get personalized recommendations and smart analytics
                </Text>
              </div>
            </div>

            <Link href={`${app_url}/dashboard`} style={button}>
              🚀 Explore Your Dashboard
            </Link>

            <div style={quickStartSection}>
              <Text style={quickStartTitle}>⚡ Quick Start Guide</Text>
              <Text style={quickStartText}>
                <strong>1. Complete Your Profile</strong><br />
                Set up your profile to get personalized recommendations<br /><br />
                
                <strong>2. Explore the Community</strong><br />
                Browse startups, connect with mentors, and discover opportunities<br /><br />
                
                <strong>3. Join Conversations</strong><br />
                Engage with the community feed and share your journey<br /><br />
                
                <strong>4. Attend Events</strong><br />
                Check out our calendar for workshops, pitch sessions, and networking events
              </Text>
            </div>

            <div style={tipsSection}>
              <Text style={tipsTitle}>💡 Pro Tips for Success</Text>
              <Text style={tipsText}>
                • Update your profile with a professional photo and compelling bio<br />
                • Be active in the community to increase your visibility<br />
                • Connect with at least 5 people in your first week<br />
                • Set up your availability for mentoring or pitch sessions<br />
                • Explore AI-powered recommendations daily for new opportunities
              </Text>
            </div>

            <div style={supportSection}>
              <Text style={supportTitle}>📚 Resources & Support</Text>
              <Text style={supportText}>
                Need help getting started? Check out our comprehensive help center or reach out to our support team. We're here to ensure your success!
              </Text>
              <div style={supportLinks}>
                <Link href={`${app_url}/help`} style={supportLink}>📖 Help Center</Link>
                <Link href={`${app_url}/guide`} style={supportLink}>🎯 Platform Guide</Link>
                <Link href={`${app_url}/community`} style={supportLink}>💬 Community Forums</Link>
              </div>
            </div>
          </div>
        </Section>

        <Section style={footer}>
          <Text style={footerWelcome}>
            Once again, welcome to Startup Factory Hub! 🎉<br />
            Let's build the future together.
          </Text>
          <div style={socialSection}>
            <Text style={socialText}>Follow us on social media:</Text>
            <div style={socialLinks}>
              <Link href="#" style={socialLink}>𝕏 Twitter</Link>
              <span style={socialSeparator}>•</span>
              <Link href="#" style={socialLink}>in LinkedIn</Link>
              <span style={socialSeparator}>•</span>
              <Link href="#" style={socialLink}>f Facebook</Link>
            </div>
          </div>
          <div style={footerLinks}>
            <Link href={`${app_url}/about`} style={footerLink}>About Us</Link>
            <span style={footerSeparator}>•</span>
            <Link href={`${app_url}/privacy`} style={footerLink}>Privacy Policy</Link>
            <span style={footerSeparator}>•</span>
            <Link href={`${app_url}/terms`} style={footerLink}>Terms of Service</Link>
          </div>
          <Text style={copyright}>
            © 2025 Startup Factory Hub. All rights reserved.<br />
            Empowering startups with AI-driven innovation
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default WelcomeEmail;

// Styles
const main = {
  backgroundColor: "#ecfdf5",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  padding: "20px",
};

const container = {
  backgroundColor: "#ffffff",
  maxWidth: "600px",
  margin: "0 auto",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 10px 40px rgba(16, 185, 129, 0.15)",
};

const header = {
  background: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
  padding: "40px 32px",
  textAlign: "center" as const,
};

const logo = {
  width: "64px",
  height: "64px",
  backgroundColor: "white",
  borderRadius: "12px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "32px",
  margin: "0 auto 16px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
};

const h1 = {
  color: "white",
  fontSize: "28px",
  fontWeight: "700",
  margin: "0",
  textShadow: "0 2px 4px rgba(0,0,0,0.1)",
};

const tagline = {
  color: "rgba(255, 255, 255, 0.95)",
  fontSize: "14px",
  fontWeight: "500",
  margin: "8px 0 0 0",
};

const heroSection = {
  padding: "40px 32px",
  textAlign: "center" as const,
  background: "linear-gradient(180deg, #ecfdf5 0%, #ffffff 100%)",
};

const heroIcon = {
  width: "100px",
  height: "100px",
  margin: "0 auto 20px",
  background: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "50px",
  boxShadow: "0 10px 30px rgba(16, 185, 129, 0.3)",
};

const h2 = {
  color: "#064e3b",
  fontSize: "28px",
  fontWeight: "700",
  margin: "0 0 12px 0",
};

const heroText = {
  color: "#065f46",
  fontSize: "16px",
  margin: "0",
  fontWeight: "500",
};

const content = {
  padding: "0 32px 32px",
};

const card = {
  backgroundColor: "white",
  borderRadius: "12px",
  padding: "32px",
  border: "2px solid #ecfdf5",
  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.08)",
};

const welcomeText = {
  color: "#1f2937",
  fontSize: "16px",
  lineHeight: "1.7",
  margin: "0 0 32px 0",
};

const featuresGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "16px",
  marginBottom: "32px",
};

const featureItem = {
  padding: "20px",
  backgroundColor: "#f9fafb",
  borderRadius: "12px",
  textAlign: "center" as const,
  border: "1px solid #e5e7eb",
};

const featureIcon = {
  fontSize: "32px",
  marginBottom: "12px",
};

const featureTitle = {
  color: "#064e3b",
  fontSize: "14px",
  fontWeight: "700",
  margin: "0 0 8px 0",
};

const featureText = {
  color: "#6b7280",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "0",
};

const button = {
  backgroundColor: "#10b981",
  background: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
  borderRadius: "10px",
  color: "white",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "16px 32px",
  boxShadow: "0 6px 20px rgba(16, 185, 129, 0.35)",
  marginBottom: "32px",
};

const quickStartSection = {
  marginBottom: "24px",
  padding: "24px",
  background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
  borderRadius: "12px",
  border: "2px solid #bbf7d0",
};

const quickStartTitle = {
  color: "#064e3b",
  fontSize: "16px",
  fontWeight: "700",
  margin: "0 0 16px 0",
};

const quickStartText = {
  color: "#065f46",
  fontSize: "14px",
  lineHeight: "1.8",
  margin: "0",
};

const tipsSection = {
  marginBottom: "24px",
  padding: "20px",
  background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
  borderRadius: "12px",
  border: "2px solid #93c5fd",
};

const tipsTitle = {
  color: "#1e40af",
  fontSize: "14px",
  fontWeight: "700",
  margin: "0 0 12px 0",
};

const tipsText = {
  color: "#1e3a8a",
  fontSize: "14px",
  lineHeight: "1.8",
  margin: "0",
};

const supportSection = {
  padding: "20px",
  backgroundColor: "#fef3c7",
  borderRadius: "12px",
  border: "2px solid #fde68a",
};

const supportTitle = {
  color: "#92400e",
  fontSize: "14px",
  fontWeight: "700",
  margin: "0 0 8px 0",
};

const supportText = {
  color: "#78350f",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 16px 0",
};

const supportLinks = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap" as const,
};

const supportLink = {
  color: "#92400e",
  fontSize: "13px",
  textDecoration: "none",
  fontWeight: "600",
  backgroundColor: "#ffffff",
  padding: "8px 16px",
  borderRadius: "6px",
  border: "1px solid #fde68a",
};

const footer = {
  background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
  padding: "40px 24px",
  textAlign: "center" as const,
};

const footerWelcome = {
  color: "#d1fae5",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 24px 0",
  lineHeight: "1.6",
};

const socialSection = {
  marginBottom: "24px",
};

const socialText = {
  color: "#a7f3d0",
  fontSize: "14px",
  margin: "0 0 12px 0",
};

const socialLinks = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap" as const,
};

const socialLink = {
  color: "#6ee7b7",
  fontSize: "14px",
  textDecoration: "none",
  fontWeight: "600",
};

const socialSeparator = {
  color: "#6ee7b7",
  margin: "0 4px",
};

const footerLinks = {
  margin: "20px 0",
};

const footerLink = {
  color: "#a7f3d0",
  fontSize: "13px",
  textDecoration: "none",
  margin: "0 8px",
};

const footerSeparator = {
  color: "#6ee7b7",
  margin: "0 4px",
};

const copyright = {
  color: "#6ee7b7",
  fontSize: "12px",
  margin: "20px 0 0 0",
  lineHeight: "1.6",
};
