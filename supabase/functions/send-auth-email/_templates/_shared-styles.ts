// Shared email styles for Startup Factory Hub
// Dark theme with correct brand colors (#0ea270)

export const sharedStyles = {
  main: {
    backgroundColor: "#0a0f1e",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    padding: "20px",
  },

  container: {
    backgroundColor: "#0f1419",
    maxWidth: "600px",
    margin: "0 auto",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 10px 40px rgba(14, 162, 112, 0.3)",
  },

  header: {
    background: "#0ea270",
    padding: "40px 32px",
    textAlign: "center" as const,
  },

  logo: {
    width: "80px",
    height: "80px",
    backgroundColor: "transparent",
    borderRadius: "16px",
    display: "inline-block",
    margin: "0 auto 20px",
    filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))",
  },

  h1: {
    color: "white",
    fontSize: "28px",
    fontWeight: "700",
    margin: "0",
    textShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },

  tagline: {
    color: "rgba(255, 255, 255, 0.95)",
    fontSize: "14px",
    fontWeight: "500",
    margin: "8px 0 0 0",
  },

  heroSection: {
    padding: "32px",
    textAlign: "center" as const,
    background: "linear-gradient(180deg, #1a1f35 0%, #0f1419 100%)",
  },

  heroIcon: {
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
  },

  h2: {
    color: "#0ea270",
    fontSize: "22px",
    fontWeight: "700",
    margin: "0",
  },

  content: {
    padding: "0 32px 32px",
  },

  card: {
    backgroundColor: "#1a1f35",
    borderRadius: "12px",
    padding: "24px",
    border: "2px solid rgba(14, 162, 112, 0.2)",
    boxShadow: "0 2px 8px rgba(14, 162, 112, 0.15)",
  },

  paragraph: {
    color: "#e5e7eb",
    fontSize: "16px",
    lineHeight: "1.7",
    margin: "0 0 24px 0",
  },

  button: {
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
  },

  divider: {
    borderTop: "1px solid rgba(14, 162, 112, 0.2)",
    margin: "24px 0",
  },

  footer: {
    background: "#0a0f1e",
    padding: "32px 24px",
    textAlign: "center" as const,
    borderTop: "1px solid rgba(14, 162, 112, 0.2)",
  },

  footerText: {
    color: "#9ca3af",
    fontSize: "14px",
    margin: "0 0 12px 0",
  },

  copyright: {
    color: "#6b7280",
    fontSize: "12px",
    margin: "16px 0 0 0",
    lineHeight: "1.6",
  },

  logoUrl: "https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/startup-factory-hub-logo.png",
};
