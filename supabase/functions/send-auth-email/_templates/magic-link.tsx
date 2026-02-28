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

interface MagicLinkEmailProps {
  supabase_url: string;
  app_url: string;
  email_action_type: string;
  redirect_to: string;
  token_hash: string;
  token: string;
}

export const MagicLinkEmail = ({
  token,
  supabase_url,
  app_url,
  email_action_type,
  redirect_to,
  token_hash,
}: MagicLinkEmailProps) => (
  <Html>
    <Head />
    <Preview>🔐 Your secure login link to Startup Factory Hub</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <img 
            src="https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png" 
            alt="Startup Factory Hub"
            style={logo}
          />
          <Heading style={h1}>Startup Factory Hub</Heading>
          <Text style={tagline}>AI-Powered Startup Accelerator Platform</Text>
        </Section>

        <Section style={heroSection}>
          <div style={heroIcon}>🔐</div>
          <Heading style={h2}>Your Magic Link is Ready!</Heading>
        </Section>

        <Section style={content}>
          <div style={card}>
            <Text style={paragraph}>
              Click the button below to securely log in to your Startup Factory Hub account. This link is valid for <strong>1 hour</strong> and can only be used once.
            </Text>

            <Link
              href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to || 'https://startupfactoryhub.com/dashboard')}`}
              style={button}
            >
              🚀 Log In to Platform
            </Link>

            <div style={divider} />

            <Text style={codeLabel}>Or use this one-time code:</Text>
            <code style={code}>{token}</code>

            <div style={tipsSection}>
              <Text style={tipsTitle}>🔒 Security Tips</Text>
              <Text style={tipsText}>
                • Never share this link or code with anyone<br />
                • This link expires in 1 hour for your security<br />
                • If you didn't request this, safely ignore this email
              </Text>
            </div>
          </div>
        </Section>

        <Section style={footer}>
          <Text style={footerText}>Need help? Contact our support team</Text>
          <div style={footerLinks}>
            <Link href="https://startupfactoryhub.com/help" style={footerLink}>Help Center</Link>
            <span style={footerSeparator}>•</span>
            <Link href="https://startupfactoryhub.com/privacy" style={footerLink}>Privacy Policy</Link>
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

export default MagicLinkEmail;

// Styles
const main = {
  backgroundColor: "#0a0f1e",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  padding: "20px",
};

const container = {
  backgroundColor: "#0f1419",
  maxWidth: "600px",
  margin: "0 auto",
  borderRadius: "16px",
  overflow: "hidden",
  boxShadow: "0 10px 40px rgba(14, 162, 112, 0.3)",
};

const header = {
  background: "#0ea270",
  padding: "40px 32px",
  textAlign: "center" as const,
};

const logo = {
  width: "80px",
  height: "80px",
  backgroundColor: "transparent",
  borderRadius: "16px",
  display: "inline-block",
  margin: "0 auto 20px",
  filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
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
  padding: "32px",
  textAlign: "center" as const,
  background: "linear-gradient(180deg, #1a1f35 0%, #0f1419 100%)",
};

const heroIcon = {
  width: "80px",
  height: "80px",
  margin: "0 auto 20px",
  background: "#0ea270",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "40px",
  boxShadow: "0 8px 24px rgba(14, 162, 112, 0.4)",
};

const h2 = {
  color: "#0ea270",
  fontSize: "22px",
  fontWeight: "700",
  margin: "0",
};

const content = {
  padding: "0 32px 32px",
};

const card = {
  backgroundColor: "#1a1f35",
  borderRadius: "12px",
  padding: "24px",
  border: "2px solid rgba(14, 162, 112, 0.2)",
  boxShadow: "0 2px 8px rgba(14, 162, 112, 0.15)",
};

const paragraph = {
  color: "#e5e7eb",
  fontSize: "16px",
  lineHeight: "1.7",
  margin: "0 0 24px 0",
};

const button = {
  backgroundColor: "#0ea270",
  background: "#0ea270",
  borderRadius: "10px",
  color: "white",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "14px 32px",
  boxShadow: "0 4px 16px rgba(14, 162, 112, 0.5)",
};

const divider = {
  borderTop: "1px solid rgba(14, 162, 112, 0.2)",
  margin: "24px 0",
};

const codeLabel = {
  color: "#9ca3af",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 12px 0",
};

const code = {
  display: "block",
  padding: "16px",
  backgroundColor: "rgba(14, 162, 112, 0.1)",
  border: "2px dashed rgba(14, 162, 112, 0.3)",
  borderRadius: "8px",
  color: "#0ea270",
  fontSize: "18px",
  fontWeight: "700",
  textAlign: "center" as const,
  letterSpacing: "2px",
  fontFamily: "monospace",
};

const tipsSection = {
  marginTop: "24px",
  padding: "20px",
  background: "rgba(14, 162, 112, 0.1)",
  borderRadius: "12px",
  borderLeft: "4px solid #0ea270",
};

const tipsTitle = {
  color: "#0ea270",
  fontSize: "14px",
  fontWeight: "700",
  margin: "0 0 8px 0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const tipsText = {
  color: "#d1d5db",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0",
};

const footer = {
  background: "#0a0f1e",
  padding: "32px 24px",
  textAlign: "center" as const,
  borderTop: "1px solid rgba(14, 162, 112, 0.2)",
};

const footerText = {
  color: "#9ca3af",
  fontSize: "14px",
  margin: "0 0 12px 0",
};

const footerLinks = {
  margin: "16px 0",
};

const footerLink = {
  color: "#a7f3d0",
  fontSize: "13px",
  textDecoration: "none",
  margin: "0 12px",
};

const footerSeparator = {
  color: "#6ee7b7",
  margin: "0 4px",
};

const copyright = {
  color: "#6ee7b7",
  fontSize: "12px",
  margin: "16px 0 0 0",
  lineHeight: "1.6",
};
