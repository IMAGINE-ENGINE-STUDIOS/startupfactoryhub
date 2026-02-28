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

interface PasswordResetEmailProps {
  supabase_url: string;
  app_url: string;
  email_action_type: string;
  redirect_to: string;
  token_hash: string;
  token: string;
}

export const PasswordResetEmail = ({
  token,
  supabase_url,
  app_url,
  email_action_type,
  redirect_to,
  token_hash,
}: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>🔑 Reset your password for Startup Factory Hub</Preview>
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
          <div style={heroIcon}>🔑</div>
          <Heading style={h2}>Password Reset Request</Heading>
        </Section>

        <Section style={content}>
          <div style={card}>
            <Text style={paragraph}>
              We received a request to reset the password for your Startup Factory Hub account. Click the button below to create a new password.
            </Text>

            <Text style={warningText}>
              ⏰ This link will expire in <strong>1 hour</strong> for security reasons.
            </Text>

            <Link
              href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to || 'https://startupfactoryhub.com/reset-password')}`}
              style={button}
            >
              🔑 Reset Password
            </Link>

            <div style={divider} />

            <Text style={codeLabel}>Or use this reset code:</Text>
            <code style={code}>{token}</code>

            <div style={securitySection}>
              <Text style={securityTitle}>🔒 Security Recommendations</Text>
              <Text style={securityText}>
                When creating your new password:<br /><br />
                ✓ Use at least 12 characters<br />
                ✓ Include uppercase and lowercase letters<br />
                ✓ Add numbers and special characters<br />
                ✓ Avoid common words or personal information<br />
                ✓ Don't reuse passwords from other accounts
              </Text>
            </div>

            <div style={alertSection}>
              <Text style={alertTitle}>⚠️ Didn't request this?</Text>
              <Text style={alertText}>
                If you didn't request a password reset, you can safely ignore this email. Your account remains secure and no changes have been made.
              </Text>
              <Text style={alertText}>
                However, if you're concerned about unauthorized access, please contact our security team immediately at <Link href="mailto:security@startupfactoryhub.com" style={emailLink}>security@startupfactoryhub.com</Link>
              </Text>
            </div>
          </div>
        </Section>

        <Section style={footer}>
          <Text style={footerText}>Need assistance? Our support team is here for you</Text>
          <div style={footerLinks}>
            <Link href="https://startupfactoryhub.com/help" style={footerLink}>Help Center</Link>
            <span style={footerSeparator}>•</span>
            <Link href="https://startupfactoryhub.com/security" style={footerLink}>Security Center</Link>
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

export default PasswordResetEmail;

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
  padding: "32px",
  textAlign: "center" as const,
  background: "linear-gradient(180deg, #ecfdf5 0%, #ffffff 100%)",
};

const heroIcon = {
  width: "80px",
  height: "80px",
  margin: "0 auto 20px",
  background: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "40px",
  boxShadow: "0 8px 24px rgba(16, 185, 129, 0.25)",
};

const h2 = {
  color: "#064e3b",
  fontSize: "22px",
  fontWeight: "700",
  margin: "0",
};

const content = {
  padding: "0 32px 32px",
};

const card = {
  backgroundColor: "white",
  borderRadius: "12px",
  padding: "24px",
  border: "2px solid #ecfdf5",
  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.08)",
};

const paragraph = {
  color: "#1f2937",
  fontSize: "16px",
  lineHeight: "1.7",
  margin: "0 0 16px 0",
};

const warningText = {
  color: "#92400e",
  fontSize: "14px",
  backgroundColor: "#fef3c7",
  padding: "12px 16px",
  borderRadius: "8px",
  margin: "0 0 24px 0",
  border: "1px solid #fde68a",
};

const button = {
  backgroundColor: "#10b981",
  background: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
  borderRadius: "10px",
  color: "white",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "14px 32px",
  boxShadow: "0 4px 16px rgba(16, 185, 129, 0.3)",
};

const divider = {
  borderTop: "1px solid #e5e7eb",
  margin: "24px 0",
};

const codeLabel = {
  color: "#6b7280",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 12px 0",
};

const code = {
  display: "block",
  padding: "16px",
  backgroundColor: "#f3f4f6",
  border: "2px dashed #d1d5db",
  borderRadius: "8px",
  color: "#064e3b",
  fontSize: "18px",
  fontWeight: "700",
  textAlign: "center" as const,
  letterSpacing: "2px",
  fontFamily: "monospace",
};

const securitySection = {
  marginTop: "24px",
  padding: "20px",
  background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
  borderRadius: "12px",
  border: "2px solid #93c5fd",
};

const securityTitle = {
  color: "#1e40af",
  fontSize: "14px",
  fontWeight: "700",
  margin: "0 0 12px 0",
};

const securityText = {
  color: "#1e3a8a",
  fontSize: "14px",
  lineHeight: "1.8",
  margin: "0",
};

const alertSection = {
  marginTop: "24px",
  padding: "20px",
  background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
  borderRadius: "12px",
  border: "2px solid #fca5a5",
};

const alertTitle = {
  color: "#991b1b",
  fontSize: "14px",
  fontWeight: "700",
  margin: "0 0 8px 0",
};

const alertText = {
  color: "#7f1d1d",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "0 0 8px 0",
};

const emailLink = {
  color: "#991b1b",
  textDecoration: "underline",
  fontWeight: "600",
};

const footer = {
  background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
  padding: "32px 24px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#d1fae5",
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
  margin: "0 8px",
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
