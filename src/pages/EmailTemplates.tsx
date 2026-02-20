import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Mail,
  Newspaper,
  Handshake,
  Send,
  Eye,
  SlidersHorizontal,
  Shield,
  Loader2,
  ArrowLeft,
  KeyRound,
  FileSignature,
} from "lucide-react";

// ─── Template HTML generators (mirrored from edge functions) ────────────────

function generateNotificationHtml(vars: {
  title: string;
  message: string;
  type: string;
}) {
  const { title, message, type } = vars;
  const icon =
    type === "connection"
      ? "🤝"
      : type === "message"
      ? "💬"
      : type === "event"
      ? "📅"
      : type === "success"
      ? "✨"
      : type === "error"
      ? "⚠️"
      : "🔔";
  const tip =
    type === "connection"
      ? "Building your network is key to startup success. Connect with mentors, investors, and fellow entrepreneurs!"
      : type === "message"
      ? "Quick responses help build stronger professional relationships. Check your messages regularly!"
      : type === "event"
      ? "Events are great opportunities to learn, network, and grow. Don't miss out!"
      : "Stay active on the platform to maximize your opportunities and connections!";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0f1e; margin: 0; padding: 20px; line-height: 1.6; }
    .email-wrapper { max-width: 600px; margin: 0 auto; }
    .container { background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(16, 185, 129, 0.15); }
    .header { background: linear-gradient(135deg, #0ea270 0%, #0ea270 100%); color: white; padding: 40px 32px; text-align: center; }
    .logo { width: 80px; height: 80px; background: transparent; border-radius: 16px; display: inline-block; margin-bottom: 20px; }
    .logo img { width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 4px 12px rgba(0,0,0,0.3)); }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .tagline { margin-top: 8px; font-size: 14px; opacity: 0.95; font-weight: 500; }
    .hero-section { padding: 32px; text-align: center; background: linear-gradient(180deg, #1a1f35 0%, #0f1419 100%); }
    .hero-icon { width: 80px; height: 80px; margin: 0 auto 20px; background: linear-gradient(135deg, #0ea270 0%, #0ea270 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px; box-shadow: 0 8px 24px rgba(14, 162, 112, 0.4); }
    .content { padding: 0 32px 32px; background: #0f1419; }
    .notification-card { background: #1a1f35; border-radius: 12px; padding: 24px; border: 2px solid rgba(14, 162, 112, 0.2); box-shadow: 0 2px 8px rgba(14, 162, 112, 0.15); }
    .notification-type { display: inline-block; padding: 8px 16px; border-radius: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .type-info { background-color: #dbeafe; color: #1e40af; }
    .type-success { background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); color: #065f46; }
    .type-warning { background-color: #fef3c7; color: #92400e; }
    .type-error { background-color: #fee2e2; color: #991b1b; }
    .type-message { background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%); color: #3730a3; }
    .type-connection { background: linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 100%); color: #5b21b6; }
    .type-event { background: linear-gradient(135deg, #fbcfe8 0%, #f9a8d4 100%); color: #831843; }
    .title { margin: 0 0 16px 0; color: #0ea270; font-size: 22px; font-weight: 700; line-height: 1.3; }
    .message { color: #e5e7eb; font-size: 16px; line-height: 1.7; margin: 16px 0; }
    .button { display: inline-block; padding: 14px 32px; background: #0ea270; color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; margin-top: 24px; box-shadow: 0 4px 16px rgba(14, 162, 112, 0.5); }
    .tips-section { margin-top: 32px; padding: 20px; background: rgba(14, 162, 112, 0.1); border-radius: 12px; border-left: 4px solid #0ea270; }
    .tips-title { color: #0ea270; font-size: 14px; font-weight: 700; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .tips-text { color: #d1d5db; font-size: 14px; line-height: 1.6; }
    .footer { background: #0a0f1e; padding: 32px 24px; text-align: center; color: #9ca3af; border-top: 1px solid rgba(14, 162, 112, 0.2); }
    .footer-text { font-size: 14px; color: #a7f3d0; margin: 8px 0; }
    .footer-links { margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255, 255, 255, 0.1); }
    .footer-link { color: #a7f3d0; text-decoration: none; font-size: 13px; margin: 0 12px; }
    .copyright { margin-top: 16px; font-size: 12px; color: #6ee7b7; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <div class="logo"><img src="https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png" alt="SFH" /></div>
        <h1>Startup Factory Hub</h1>
        <div class="tagline">AI-Powered Startup Accelerator Platform</div>
      </div>
      <div class="hero-section">
        <div class="hero-icon">${icon}</div>
      </div>
      <div class="content" style="padding-top:24px;">
        <div class="notification-card">
          <span class="notification-type type-${type}">${type}</span>
          <h2 class="title">${title}</h2>
          <div class="message">${message}</div>
          <a href="https://startupfactoryhub.com/dashboard" class="button">🚀 View on Platform</a>
        </div>
        <div class="tips-section">
          <div class="tips-title">💡 Pro Tip</div>
          <div class="tips-text">${tip}</div>
        </div>
      </div>
      <div class="footer">
        <div class="footer-text">Connect with us on social media</div>
        <div class="footer-links">
          <a href="https://startupfactoryhub.com" class="footer-link">Website</a>
          <a href="https://www.linkedin.com/company/startup-factory-hub/?viewAsMember=true" class="footer-link">LinkedIn</a>
          <a href="https://startupfactoryhub.com" class="footer-link">Help Center</a>
        </div>
        <div class="copyright">© 2025 Startup Factory Hub. All rights reserved.</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function generateInvitationHtml(vars: {
  email: string;
  jobTitle: string;
  companyName: string;
  token: string;
}) {
  const { email, jobTitle, companyName, token } = vars;
  const invitationUrl = `https://startupfactoryhub.com/accept-invitation?token=${token || "PREVIEW_TOKEN"}`;
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #0a0f1e; padding: 20px; }
    .wrapper { max-width: 600px; margin: 0 auto; }
    .container { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(16,185,129,0.15); }
    .header { background: linear-gradient(135deg, #0ea270 0%, #059669 100%); padding: 40px 32px; text-align: center; }
    .logo { width: 80px; height: 80px; margin: 0 auto 16px; border-radius: 16px; overflow: hidden; }
    .logo img { width: 100%; height: 100%; object-fit: contain; }
    .header h1 { color: #fff; font-size: 26px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.9); font-size: 14px; margin-top: 6px; }
    .hero { background: linear-gradient(180deg,#1a1f35 0%,#0f1419 100%); padding: 32px; text-align: center; }
    .badge { display: inline-block; background: rgba(14,162,112,0.15); border: 1px solid rgba(14,162,112,0.3); color: #0ea270; padding: 8px 20px; border-radius: 50px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }
    .hero-icon { font-size: 64px; margin-bottom: 16px; }
    .hero h2 { color: #fff; font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    .hero p { color: #9ca3af; font-size: 15px; line-height: 1.6; }
    .content { padding: 32px; background: #0f1419; }
    .card { background: #1a1f35; border-radius: 12px; padding: 24px; border: 1px solid rgba(14,162,112,0.2); margin-bottom: 24px; }
    .card-title { color: #0ea270; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #9ca3af; font-size: 14px; }
    .detail-value { color: #f3f4f6; font-size: 14px; font-weight: 600; }
    .steps { margin-bottom: 24px; }
    .step { display: flex; gap: 16px; margin-bottom: 16px; align-items: flex-start; }
    .step-num { width: 32px; height: 32px; background: #0ea270; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; font-weight: 700; flex-shrink: 0; }
    .step-text h4 { color: #f3f4f6; font-size: 14px; font-weight: 600; margin-bottom: 2px; }
    .step-text p { color: #9ca3af; font-size: 13px; }
    .cta-section { text-align: center; margin: 32px 0 24px; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg,#0ea270,#059669); color: #fff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 16px; font-weight: 700; letter-spacing: 0.3px; box-shadow: 0 8px 24px rgba(14,162,112,0.4); }
    .expiry { background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.3); border-radius: 8px; padding: 12px 16px; text-align: center; color: #fbbf24; font-size: 13px; margin-top: 24px; }
    .url-fallback { margin-top: 16px; padding: 12px; background: rgba(255,255,255,0.05); border-radius: 8px; word-break: break-all; font-size: 12px; color: #6b7280; }
    .footer { background: #0a0f1e; padding: 32px; text-align: center; border-top: 1px solid rgba(14,162,112,0.15); }
    .footer p { color: #6b7280; font-size: 13px; line-height: 1.6; }
    .footer a { color: #0ea270; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo"><img src="https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png" alt="SFH Logo" /></div>
        <h1>Startup Factory Hub</h1>
        <p>AI-Powered Startup Accelerator Platform</p>
      </div>
      <div class="hero">
        <div class="badge">🎉 Application Selected</div>
        <div class="hero-icon">🚀</div>
        <h2>You've Been Chosen!</h2>
        <p>Congratulations — your application stood out. You've been selected to move forward.<br>Create your account to access your tasks and begin your journey.</p>
      </div>
      <div class="content">
        <div class="card">
          <div class="card-title">📋 Application Details</div>
          ${jobTitle ? `<div class="detail-row"><span class="detail-label">Position</span><span class="detail-value">${jobTitle}</span></div>` : ""}
          ${companyName ? `<div class="detail-row"><span class="detail-label">Company</span><span class="detail-value">${companyName}</span></div>` : ""}
          <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value" style="color:#0ea270">✅ Selected</span></div>
          <div class="detail-row"><span class="detail-label">Invitation Sent To</span><span class="detail-value">${email}</span></div>
        </div>
        <div class="steps">
          <div class="step"><div class="step-num">1</div><div class="step-text"><h4>Click the button below</h4><p>You'll be taken to the platform to create your account</p></div></div>
          <div class="step"><div class="step-num">2</div><div class="step-text"><h4>Complete your profile</h4><p>Set up your account with your details and skills</p></div></div>
          <div class="step"><div class="step-num">3</div><div class="step-text"><h4>Start your tasks</h4><p>Access your task list and begin contributing immediately</p></div></div>
        </div>
        <div class="cta-section"><a href="${invitationUrl}" class="cta-btn">🚀 Accept Invitation & Get Started</a></div>
        <div class="expiry">⏰ This invitation expires in <strong>48 hours</strong>. Please accept it as soon as possible.</div>
        <div class="url-fallback">If the button doesn't work, copy and paste this link:<br>${invitationUrl}</div>
      </div>
      <div class="footer">
        <p>This invitation was sent to <strong>${email}</strong>.</p>
        <p style="margin-top:8px">© 2025 Startup Factory Hub · <a href="https://startupfactoryhub.com">startupfactoryhub.com</a> · <a href="https://www.linkedin.com/company/startup-factory-hub/?viewAsMember=true" style="color:#0ea270;text-decoration:none;">LinkedIn</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function generateWeeklyDigestHtml() {
  const mockData = {
    recipientName: "Member",
    startups: ["TechNova AI", "GreenLeaf Logistics", "MedBridge Health"],
    mentors: ["Sarah Chen", "Marcus Williams"],
    investors: ["Horizon Ventures", "BlueSky Capital"],
    resources: ["Startup Funding Guide 2025", "AI Tools for Entrepreneurs"],
    events: ["Demo Day Q1", "Investor Pitch Night"],
  };

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #0a0f1e; padding: 20px; }
    .wrapper { max-width: 600px; margin: 0 auto; }
    .container { background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(16,185,129,0.15); }
    .header { background: linear-gradient(135deg,#0ea270 0%,#059669 100%); padding: 40px 32px; text-align: center; }
    .header img { width: 70px; height: 70px; border-radius: 14px; margin-bottom: 14px; }
    .header h1 { color: #fff; font-size: 24px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.85); font-size: 13px; margin-top: 4px; }
    .hero { background: #1a1f35; padding: 28px 32px; text-align: center; }
    .week-badge { display: inline-block; background: rgba(14,162,112,0.15); border: 1px solid rgba(14,162,112,0.3); color: #0ea270; padding: 6px 18px; border-radius: 50px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 16px; }
    .hero h2 { color: #f3f4f6; font-size: 22px; font-weight: 700; margin-bottom: 6px; }
    .hero p { color: #9ca3af; font-size: 14px; }
    .stats-row { display: flex; gap: 0; border-bottom: 1px solid rgba(14,162,112,0.15); }
    .stat { flex: 1; padding: 20px 16px; text-align: center; background: #0f1419; border-right: 1px solid rgba(14,162,112,0.1); }
    .stat:last-child { border-right: none; }
    .stat-num { font-size: 28px; font-weight: 800; color: #0ea270; }
    .stat-label { font-size: 11px; color: #6b7280; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
    .content { padding: 24px 32px; background: #0f1419; }
    .section { background: #1a1f35; border-radius: 12px; border: 1px solid rgba(14,162,112,0.15); margin-bottom: 16px; overflow: hidden; }
    .section-header { padding: 14px 20px; font-size: 14px; font-weight: 700; color: #f3f4f6; background: rgba(14,162,112,0.08); border-bottom: 1px solid rgba(14,162,112,0.1); }
    .count { display: inline-block; background: #0ea270; color: #fff; padding: 2px 10px; border-radius: 50px; font-size: 11px; font-weight: 700; margin-left: 8px; }
    .section-content { padding: 12px 20px; }
    .item { color: #d1d5db; font-size: 13px; padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .item:last-child { border-bottom: none; }
    .cta-section { text-align: center; padding: 24px 0 8px; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg,#0ea270,#059669); color: #fff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-size: 15px; font-weight: 700; box-shadow: 0 6px 20px rgba(14,162,112,0.4); }
    .footer { background: #0a0f1e; padding: 28px 32px; text-align: center; border-top: 1px solid rgba(14,162,112,0.1); }
    .footer p { color: #6b7280; font-size: 12px; line-height: 1.6; }
    .footer a { color: #0ea270; text-decoration: none; }
    .mock-badge { background: rgba(251,191,36,0.15); border: 1px solid rgba(251,191,36,0.3); color: #fbbf24; padding: 8px 16px; text-align: center; font-size: 12px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="mock-badge">⚠️ Preview Mode — Sample data shown. Live digest pulls real platform data.</div>
      <div class="header">
        <img src="https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png" alt="SFH" />
        <h1>Startup Factory Hub</h1>
        <p>Your Weekly Platform Digest</p>
      </div>
      <div class="hero">
        <div class="week-badge">📰 Weekly Digest</div>
        <h2>Hi ${mockData.recipientName}! Here's what's new 👋</h2>
        <p>${mockData.startups.length + mockData.mentors.length + mockData.investors.length} new members joined the platform this week</p>
      </div>
      <div class="stats-row">
        <div class="stat"><div class="stat-num">${mockData.startups.length}</div><div class="stat-label">Startups</div></div>
        <div class="stat"><div class="stat-num">${mockData.mentors.length}</div><div class="stat-label">Mentors</div></div>
        <div class="stat"><div class="stat-num">${mockData.investors.length}</div><div class="stat-label">Investors</div></div>
        <div class="stat"><div class="stat-num">${mockData.resources.length + mockData.events.length}</div><div class="stat-label">Resources & Events</div></div>
      </div>
      <div class="content">
        <div class="section">
          <div class="section-header">🚀 New Startups <span class="count">${mockData.startups.length} new</span></div>
          <div class="section-content">${mockData.startups.map(s => `<div class="item">• ${s}</div>`).join("")}</div>
        </div>
        <div class="section">
          <div class="section-header">🎓 New Mentors <span class="count">${mockData.mentors.length} new</span></div>
          <div class="section-content">${mockData.mentors.map(m => `<div class="item">• ${m}</div>`).join("")}</div>
        </div>
        <div class="section">
          <div class="section-header">💰 New Investors <span class="count">${mockData.investors.length} new</span></div>
          <div class="section-content">${mockData.investors.map(i => `<div class="item">• ${i}</div>`).join("")}</div>
        </div>
        <div class="section">
          <div class="section-header">📚 New Resources <span class="count">${mockData.resources.length} new</span></div>
          <div class="section-content">${mockData.resources.map(r => `<div class="item">• ${r}</div>`).join("")}</div>
        </div>
        <div class="section">
          <div class="section-header">📅 Upcoming Events <span class="count">${mockData.events.length} new</span></div>
          <div class="section-content">${mockData.events.map(e => `<div class="item">• ${e}</div>`).join("")}</div>
        </div>
        <div class="cta-section"><a href="https://startupfactoryhub.com/dashboard" class="cta-btn">🔭 Explore the Platform</a></div>
      </div>
      <div class="footer">
        <p>You're receiving this weekly digest as a member of Startup Factory Hub.</p>
        <p style="margin-top:8px">© 2025 <a href="https://startupfactoryhub.com">Startup Factory Hub</a> · <a href="https://www.linkedin.com/company/startup-factory-hub/?viewAsMember=true" style="color:#0ea270;text-decoration:none;">LinkedIn</a> · All rights reserved</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function generatePartnershipHtml(vars: {
  partnerName: string;
  partnerLogo: string;
  partnerWebsite: string;
  partnerDescription: string;
  benefitsForStartups: string;
  ctaLabel: string;
  ctaUrl: string;
}) {
  const {
    partnerName,
    partnerLogo,
    partnerWebsite,
    partnerDescription,
    benefitsForStartups,
    ctaLabel,
    ctaUrl,
  } = vars;

  const benefitsList = benefitsForStartups
    .split("\n")
    .filter((b) => b.trim())
    .map((b) => `<li>${b.trim()}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #0a0f1e; padding: 20px; }
    .wrapper { max-width: 600px; margin: 0 auto; }
    .container { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(16,185,129,0.15); }
    .header { background: linear-gradient(135deg,#0ea270 0%,#059669 100%); padding: 36px 32px; text-align: center; }
    .header img.logo { width: 70px; height: 70px; border-radius: 14px; margin-bottom: 12px; object-fit: contain; }
    .header h1 { color: #fff; font-size: 22px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.85); font-size: 13px; margin-top: 4px; }
    .partnership-banner { background: linear-gradient(135deg,#1a1f35,#0f1419); padding: 36px 32px; text-align: center; }
    .partnership-badge { display: inline-block; background: rgba(14,162,112,0.15); border: 1px solid rgba(14,162,112,0.4); color: #0ea270; padding: 6px 20px; border-radius: 50px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 24px; }
    .logos-row { display: flex; align-items: center; justify-content: center; gap: 20px; margin: 20px 0; }
    .sfh-logo { width: 64px; height: 64px; border-radius: 12px; object-fit: contain; background: rgba(255,255,255,0.05); padding: 4px; }
    .plus { font-size: 28px; color: #0ea270; font-weight: 700; }
    .partner-logo { width: 64px; height: 64px; border-radius: 12px; object-fit: contain; background: rgba(255,255,255,0.05); padding: 4px; }
    .partner-placeholder { width: 64px; height: 64px; border-radius: 12px; background: rgba(14,162,112,0.2); border: 2px solid rgba(14,162,112,0.4); display: flex; align-items: center; justify-content: center; font-size: 24px; }
    .partnership-banner h2 { color: #f3f4f6; font-size: 24px; font-weight: 800; margin: 16px 0 8px; }
    .partnership-banner p { color: #9ca3af; font-size: 14px; line-height: 1.6; }
    .content { padding: 28px 32px; background: #0f1419; }
    .card { background: #1a1f35; border-radius: 12px; padding: 24px; border: 1px solid rgba(14,162,112,0.2); margin-bottom: 20px; }
    .card-label { color: #0ea270; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .card p { color: #d1d5db; font-size: 14px; line-height: 1.7; }
    .benefits-list { list-style: none; }
    .benefits-list li { color: #d1d5db; font-size: 14px; padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: flex-start; gap: 10px; }
    .benefits-list li:last-child { border-bottom: none; }
    .benefits-list li::before { content: '✅'; flex-shrink: 0; }
    .cta-section { text-align: center; padding: 12px 0 8px; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg,#0ea270,#059669); color: #fff; text-decoration: none; padding: 15px 40px; border-radius: 12px; font-size: 16px; font-weight: 700; box-shadow: 0 6px 24px rgba(14,162,112,0.4); }
    .footer { background: #0a0f1e; padding: 28px 32px; text-align: center; border-top: 1px solid rgba(14,162,112,0.1); }
    .footer p { color: #6b7280; font-size: 12px; line-height: 1.6; }
    .footer a { color: #0ea270; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <img class="logo" src="https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png" alt="SFH" />
        <h1>Startup Factory Hub</h1>
        <p>Platform Announcement</p>
      </div>
      <div class="partnership-banner">
        <div class="partnership-badge">🤝 New Partnership</div>
        <div class="logos-row">
          <img class="sfh-logo" src="https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png" alt="SFH" />
          <span class="plus">×</span>
          ${partnerLogo
            ? `<img class="partner-logo" src="${partnerLogo}" alt="${partnerName}" />`
            : `<div class="partner-placeholder">🏢</div>`}
        </div>
        <h2>SFH × ${partnerName || "Partner Name"}</h2>
        <p>We're excited to announce a new partnership that brings more value to our community!</p>
      </div>
      <div class="content">
        <div class="card">
          <div class="card-label">🏢 About ${partnerName || "Partner"}</div>
          <p>${partnerDescription || "Partner description goes here."}</p>
          ${partnerWebsite ? `<p style="margin-top:12px"><a href="${partnerWebsite}" style="color:#0ea270;text-decoration:none;font-weight:600;">🌐 Visit their website →</a></p>` : ""}
        </div>
        ${benefitsList ? `<div class="card"><div class="card-label">🎁 Benefits for You</div><ul class="benefits-list">${benefitsList}</ul></div>` : ""}
        <div class="cta-section"><a href="${ctaUrl || "https://startupfactoryhub.com/dashboard"}" class="cta-btn">🚀 ${ctaLabel || "Learn More"}</a></div>
      </div>
      <div class="footer">
        <p>You're receiving this as a valued member of Startup Factory Hub.</p>
        <p style="margin-top:8px">© 2025 <a href="https://startupfactoryhub.com">Startup Factory Hub</a> · <a href="https://www.linkedin.com/company/startup-factory-hub/?viewAsMember=true" style="color:#0ea270;text-decoration:none;">LinkedIn</a> · All rights reserved</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ─── Auth Email HTML generators ───────────────────────────────────────────────

function generateAuthEmailHtml(vars: {
  authType: string;
  userEmail: string;
  token: string;
}) {
  const { authType, userEmail, token } = vars;
  const baseUrl = "https://startupfactoryhub.com";

  const configs: Record<string, { subject: string; icon: string; headline: string; body: string; cta: string; actionUrl: string }> = {
    magiclink: {
      subject: "🔐 Your Magic Link",
      icon: "🔐",
      headline: "Sign in to Startup Factory Hub",
      body: "Click the button below to securely sign in. This magic link will expire in 1 hour.",
      cta: "Sign In Securely",
      actionUrl: `${baseUrl}/auth/v1/verify?token=${token || "PREVIEW_TOKEN"}&type=magiclink`,
    },
    signup: {
      subject: "✨ Verify Your Email",
      icon: "✨",
      headline: "Welcome! Verify your email to get started",
      body: "Thank you for signing up. Please verify your email address to activate your account and access all platform features.",
      cta: "Verify Email Address",
      actionUrl: `${baseUrl}/auth/v1/verify?token=${token || "PREVIEW_TOKEN"}&type=signup`,
    },
    recovery: {
      subject: "🔑 Reset Your Password",
      icon: "🔑",
      headline: "Reset your password",
      body: "You requested a password reset for your Startup Factory Hub account. Click below to choose a new password. This link expires in 1 hour.",
      cta: "Reset Password",
      actionUrl: `${baseUrl}/auth/v1/verify?token=${token || "PREVIEW_TOKEN"}&type=recovery`,
    },
    welcome: {
      subject: "🚀 Welcome to SFH!",
      icon: "🚀",
      headline: "You're in! Welcome to Startup Factory Hub",
      body: "Your account has been created successfully. Explore the platform, connect with mentors, discover investors, and join an accelerator cohort.",
      cta: "Explore the Platform",
      actionUrl: `${baseUrl}/dashboard`,
    },
  };

  const cfg = configs[authType] || configs.signup;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #0a0f1e; padding: 20px; }
    .wrapper { max-width: 600px; margin: 0 auto; }
    .container { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(16,185,129,0.15); }
    .header { background: linear-gradient(135deg, #0ea270 0%, #059669 100%); padding: 40px 32px; text-align: center; }
    .header img { width: 72px; height: 72px; border-radius: 14px; margin-bottom: 14px; object-fit: contain; }
    .header h1 { color: #fff; font-size: 22px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.85); font-size: 13px; margin-top: 4px; }
    .hero { background: linear-gradient(180deg,#1a1f35 0%,#0f1419 100%); padding: 40px 32px; text-align: center; }
    .hero-icon { font-size: 56px; margin-bottom: 16px; display: block; }
    .hero h2 { color: #f3f4f6; font-size: 22px; font-weight: 700; margin-bottom: 10px; }
    .hero p { color: #9ca3af; font-size: 14px; line-height: 1.7; max-width: 420px; margin: 0 auto; }
    .content { padding: 32px; background: #0f1419; }
    .card { background: #1a1f35; border-radius: 12px; padding: 24px; border: 1px solid rgba(14,162,112,0.2); margin-bottom: 20px; }
    .cta-section { text-align: center; padding: 8px 0 20px; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg,#0ea270,#059669); color: #fff; text-decoration: none; padding: 15px 40px; border-radius: 12px; font-size: 15px; font-weight: 700; box-shadow: 0 6px 20px rgba(14,162,112,0.4); }
    .url-fallback { background: rgba(255,255,255,0.04); border-radius: 8px; padding: 12px 16px; margin-top: 20px; }
    .url-fallback p { color: #6b7280; font-size: 12px; margin-bottom: 6px; }
    .url-fallback code { color: #0ea270; font-size: 11px; word-break: break-all; }
    .expiry { background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.25); border-radius: 8px; padding: 10px 16px; text-align: center; color: #fbbf24; font-size: 12px; margin-top: 16px; }
    .recipient { color: #6b7280; font-size: 12px; text-align: center; margin-top: 8px; }
    .footer { background: #0a0f1e; padding: 28px 32px; text-align: center; border-top: 1px solid rgba(14,162,112,0.1); }
    .footer p { color: #6b7280; font-size: 12px; line-height: 1.6; }
    .footer a { color: #0ea270; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <img src="https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png" alt="SFH" />
        <h1>Startup Factory Hub</h1>
        <p>AI-Powered Startup Accelerator Platform</p>
      </div>
      <div class="hero">
        <span class="hero-icon">${cfg.icon}</span>
        <h2>${cfg.headline}</h2>
        <p>${cfg.body}</p>
      </div>
      <div class="content">
        <div class="cta-section">
          <a href="${cfg.actionUrl}" class="cta-btn">${cfg.cta}</a>
        </div>
        ${authType !== "welcome" ? `<div class="expiry">⏰ This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.</div>` : ""}
        <div class="url-fallback">
          <p>If the button doesn't work, copy and paste this link:</p>
          <code>${cfg.actionUrl}</code>
        </div>
        ${userEmail ? `<p class="recipient">This email was sent to ${userEmail}</p>` : ""}
      </div>
      <div class="footer">
        <p>© 2025 <a href="https://startupfactoryhub.com">Startup Factory Hub</a> · <a href="https://www.linkedin.com/company/startup-factory-hub/?viewAsMember=true" style="color:#0ea270;text-decoration:none;">LinkedIn</a> · All rights reserved</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ─── PDF Signature HTML generator ────────────────────────────────────────────

function generatePdfSignatureHtml(vars: {
  to: string;
  documentTitle: string;
  shareToken: string;
  senderName: string;
  message: string;
  accessLevel: string;
}) {
  const { to, documentTitle, shareToken, senderName, message, accessLevel } = vars;
  const shareUrl = `https://startupfactoryhub.com/pdf-view/${shareToken || "preview-token"}`;
  const actionText = accessLevel === "sign" ? "Sign PDF" : accessLevel === "edit" ? "Edit PDF" : "View PDF";
  const description = accessLevel === "sign"
    ? "has invited you to sign a PDF document."
    : accessLevel === "edit"
    ? "has invited you to edit a PDF document."
    : "has shared a PDF document with you.";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #0a0f1e; padding: 20px; }
    .wrapper { max-width: 600px; margin: 0 auto; }
    .container { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(16,185,129,0.15); }
    .header { background: linear-gradient(135deg, #0ea270 0%, #059669 100%); padding: 40px 32px; text-align: center; }
    .header img { width: 72px; height: 72px; border-radius: 14px; margin-bottom: 14px; object-fit: contain; }
    .header h1 { color: #fff; font-size: 22px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.85); font-size: 13px; margin-top: 4px; }
    .hero { background: linear-gradient(180deg,#1a1f35 0%,#0f1419 100%); padding: 36px 32px; text-align: center; }
    .hero-badge { display: inline-block; background: rgba(14,162,112,0.15); border: 1px solid rgba(14,162,112,0.3); color: #0ea270; padding: 6px 18px; border-radius: 50px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
    .hero-icon { font-size: 52px; margin-bottom: 12px; display: block; }
    .hero h2 { color: #f3f4f6; font-size: 20px; font-weight: 700; margin-bottom: 6px; }
    .hero p { color: #9ca3af; font-size: 14px; }
    .content { padding: 28px 32px; background: #0f1419; }
    .card { background: #1a1f35; border-radius: 12px; padding: 20px 24px; border: 1px solid rgba(14,162,112,0.2); margin-bottom: 20px; }
    .card-label { color: #0ea270; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #9ca3af; font-size: 13px; }
    .detail-value { color: #f3f4f6; font-size: 13px; font-weight: 600; }
    .message-box { background: rgba(14,162,112,0.07); border: 1px solid rgba(14,162,112,0.15); border-radius: 8px; padding: 12px 16px; color: #d1d5db; font-size: 13px; line-height: 1.6; font-style: italic; }
    .cta-section { text-align: center; padding: 4px 0 20px; }
    .cta-btn { display: inline-block; background: linear-gradient(135deg,#0ea270,#059669); color: #fff; text-decoration: none; padding: 14px 38px; border-radius: 12px; font-size: 15px; font-weight: 700; box-shadow: 0 6px 20px rgba(14,162,112,0.4); }
    .url-fallback { background: rgba(255,255,255,0.04); border-radius: 8px; padding: 12px 16px; margin-top: 16px; }
    .url-fallback p { color: #6b7280; font-size: 12px; margin-bottom: 4px; }
    .url-fallback code { color: #0ea270; font-size: 11px; word-break: break-all; }
    .footer { background: #0a0f1e; padding: 28px 32px; text-align: center; border-top: 1px solid rgba(14,162,112,0.1); }
    .footer p { color: #6b7280; font-size: 12px; line-height: 1.6; }
    .footer a { color: #0ea270; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <img src="https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png" alt="SFH" />
        <h1>Startup Factory Hub</h1>
        <p>LightPaper Document Suite</p>
      </div>
      <div class="hero">
        <div class="hero-badge">📄 Document Shared</div>
        <span class="hero-icon">${accessLevel === "sign" ? "✍️" : accessLevel === "edit" ? "✏️" : "📄"}</span>
        <h2>${actionText} Request</h2>
        <p><strong style="color:#f3f4f6">${senderName || "Someone"}</strong> ${description}</p>
      </div>
      <div class="content">
        <div class="card">
          <div class="card-label">📋 Document Details</div>
          <div class="detail-row">
            <span class="detail-label">Document</span>
            <span class="detail-value">${documentTitle || "Untitled Document"}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Shared By</span>
            <span class="detail-value">${senderName || "—"}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Access Level</span>
            <span class="detail-value" style="color:#0ea270">${accessLevel || "view"}</span>
          </div>
          ${to ? `<div class="detail-row"><span class="detail-label">Recipient</span><span class="detail-value">${to}</span></div>` : ""}
        </div>
        ${message ? `<div class="message-box">"${message}"</div><br/>` : ""}
        <div class="cta-section">
          <a href="${shareUrl}" class="cta-btn">📄 ${actionText}</a>
        </div>
        <div class="url-fallback">
          <p>If the button doesn't work, copy and paste this link:</p>
          <code>${shareUrl}</code>
        </div>
      </div>
      <div class="footer">
        <p>This is an automated email from LightPaper, powered by Startup Factory Hub.</p>
        <p style="margin-top:8px">© 2025 <a href="https://startupfactoryhub.com">Startup Factory Hub</a> · <a href="https://www.linkedin.com/company/startup-factory-hub/?viewAsMember=true" style="color:#0ea270;text-decoration:none;">LinkedIn</a> · All rights reserved</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ─── Template config ────────────────────────────────────────────────────────

const TEMPLATES = [
  {
    id: "notification",
    label: "Notification Email",
    icon: Bell,
    description: "Platform alerts and updates sent to individual users",
    edgeFunction: "send-notification-email",
  },
  {
    id: "invitation",
    label: "Application Invitation",
    icon: Mail,
    description: "Sent when an applicant is selected for a job/internship",
    edgeFunction: "send-application-invitation",
  },
  {
    id: "digest",
    label: "Weekly Digest",
    icon: Newspaper,
    description: "Monday morning summary of new platform activity",
    edgeFunction: "weekly-digest",
  },
  {
    id: "partnership",
    label: "Partnership Announcement",
    icon: Handshake,
    description: "Broadcast to all users when a new partner joins",
    edgeFunction: "send-partnership-announcement",
  },
  {
    id: "auth",
    label: "Auth Emails",
    icon: KeyRound,
    description: "Magic link, email verification, password reset & welcome",
    edgeFunction: "send-auth-email",
  },
  {
    id: "pdf-signature",
    label: "PDF Signature Request",
    icon: FileSignature,
    description: "Sent when a user shares a document for viewing or signing",
    edgeFunction: "send-pdf-signature-request",
  },
] as const;

type TemplateId = (typeof TEMPLATES)[number]["id"];

// ─── Default variable states ─────────────────────────────────────────────────

const defaultVars = {
  notification: {
    to: "",
    title: "You have a new connection request!",
    message:
      "Sarah Chen, a Startup Mentor at Startup Factory Hub, wants to connect with you. Building your network is key to success — accept their request and start collaborating!",
    type: "connection",
  },
  invitation: {
    to: "",
    email: "applicant@example.com",
    jobTitle: "Frontend Developer Intern",
    companyName: "TechNova AI",
    token: "preview-token-abc123",
  },
  digest: {
    to: "",
  },
  partnership: {
    to: "",
    partnerName: "Acme Ventures",
    partnerLogo: "",
    partnerWebsite: "https://acmeventures.example.com",
    partnerDescription:
      "Acme Ventures is a leading early-stage fund focused on AI and deep-tech startups across Southeast Asia.",
    benefitsForStartups:
      "Access to $250K pre-seed funding\nFree co-working space for 3 months\nDedicated startup coach",
    ctaLabel: "Learn More",
    ctaUrl: "https://startupfactoryhub.com/dashboard",
  },
  auth: {
    to: "",
    authType: "magiclink",
    userEmail: "user@example.com",
    token: "preview-token-abc123",
  },
  "pdf-signature": {
    to: "",
    documentTitle: "Startup Equity Agreement 2025",
    shareToken: "preview-share-token",
    senderName: "Alex Johnson",
    message: "Please review and sign this document at your earliest convenience.",
    accessLevel: "sign",
  },
};

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function EmailTemplates() {
  const navigate = useNavigate();
  const { role, loading } = useUserRole();
  const { toast } = useToast();

  const [selected, setSelected] = useState<TemplateId>("notification");
  const [vars, setVars] = useState(defaultVars);
  const [sending, setSending] = useState(false);

  // Admin guard
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (role !== "admin") {
    navigate("/auth");
    return null;
  }

  const currentTemplate = TEMPLATES.find((t) => t.id === selected)!;

  function getPreviewHtml() {
    if (selected === "notification") return generateNotificationHtml(vars.notification);
    if (selected === "invitation") return generateInvitationHtml(vars.invitation);
    if (selected === "digest") return generateWeeklyDigestHtml();
    if (selected === "partnership") return generatePartnershipHtml(vars.partnership);
    if (selected === "auth") return generateAuthEmailHtml(vars.auth);
    if (selected === "pdf-signature") return generatePdfSignatureHtml(vars["pdf-signature"]);
    return "";
  }

  function updateVar(template: TemplateId, key: string, value: string) {
    setVars((prev) => ({
      ...prev,
      [template]: { ...(prev[template] as any), [key]: value },
    }));
  }

  async function handleSendTest() {
    const toEmail = (vars[selected] as any).to;
    if (!toEmail) {
      toast({ title: "Missing recipient", description: "Enter a Test Recipient Email first.", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      let payload: Record<string, unknown> = {};

      if (selected === "notification") {
        const v = vars.notification;
        payload = { to: toEmail, title: v.title, message: v.message, type: v.type };
      } else if (selected === "invitation") {
        const v = vars.invitation;
        payload = { email: toEmail, jobTitle: v.jobTitle, companyName: v.companyName, token: v.token, applicationId: "preview" };
      } else if (selected === "digest") {
        payload = { targetEmails: [toEmail] };
      } else if (selected === "partnership") {
        const v = vars.partnership;
        payload = {
          targetEmails: [toEmail],
          partnerName: v.partnerName,
          partnerLogo: v.partnerLogo,
          partnerWebsite: v.partnerWebsite,
          partnerDescription: v.partnerDescription,
          benefitsForStartups: v.benefitsForStartups.split("\n").filter(Boolean),
          ctaLabel: v.ctaLabel,
          ctaUrl: v.ctaUrl,
        };
      } else if (selected === "auth") {
        toast({ title: "ℹ️ Auth emails", description: "Auth emails are triggered automatically by Supabase — they cannot be sent manually from here.", variant: "default" });
        setSending(false);
        return;
      } else if (selected === "pdf-signature") {
        const v = vars["pdf-signature"];
        payload = {
          to: toEmail,
          documentTitle: v.documentTitle,
          shareToken: v.shareToken,
          senderName: v.senderName,
          message: v.message,
          accessLevel: v.accessLevel,
        };
      }

      const { error } = await supabase.functions.invoke(currentTemplate.edgeFunction, {
        body: payload,
      });

      if (error) throw error;

      toast({
        title: "✅ Test email sent!",
        description: `Check ${toEmail} for the ${currentTemplate.label}.`,
      });
    } catch (err: any) {
      toast({
        title: "Failed to send",
        description: err.message || "Unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border bg-card px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Email Template Manager</h1>
            <p className="text-xs text-muted-foreground">Preview, configure, and test platform email templates</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1.5 border-primary/40 text-primary">
          <Shield className="h-3 w-3" /> Admin Only
        </Badge>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Templates</p>
            <div className="space-y-1">
              {TEMPLATES.map((t) => {
                const Icon = t.icon;
                const isActive = selected === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t.id)}
                    className={`w-full text-left rounded-lg px-3 py-3 transition-colors flex items-start gap-3 ${
                      isActive
                        ? "bg-primary/10 border border-primary/30 text-primary"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${isActive ? "text-primary" : ""}`} />
                    <div>
                      <p className="text-sm font-medium leading-tight">{t.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{t.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main panel */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <Tabs defaultValue="preview" className="flex flex-col flex-1 overflow-hidden">
            {/* Tab bar + Send button */}
            <div className="border-b border-border bg-card px-6 py-3 flex items-center justify-between shrink-0">
              <TabsList className="h-9">
                <TabsTrigger value="preview" className="gap-1.5 text-xs">
                  <Eye className="h-3.5 w-3.5" /> Preview
                </TabsTrigger>
                <TabsTrigger value="variables" className="gap-1.5 text-xs">
                  <SlidersHorizontal className="h-3.5 w-3.5" /> Variables
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">Test Recipient</Label>
                  <Input
                    type="email"
                    placeholder="test@example.com"
                    value={(vars[selected] as any).to || ""}
                    onChange={(e) => updateVar(selected, "to", e.target.value)}
                    className="h-8 w-52 text-xs"
                  />
                </div>
                <Button size="sm" onClick={handleSendTest} disabled={sending} className="gap-1.5">
                  {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  {sending ? "Sending…" : "Send Test"}
                </Button>
              </div>
            </div>

            {/* Preview tab */}
            <TabsContent value="preview" className="flex-1 overflow-hidden m-0 p-0">
              <div className="h-full w-full bg-muted/30 p-4">
                <iframe
                  key={getPreviewHtml()}
                  srcDoc={getPreviewHtml()}
                  sandbox="allow-same-origin"
                  className="w-full h-full rounded-lg border border-border bg-white shadow-sm"
                  title={`${currentTemplate.label} Preview`}
                />
              </div>
            </TabsContent>

            {/* Variables tab */}
            <TabsContent value="variables" className="flex-1 overflow-y-auto m-0 p-6">
              <div className="max-w-2xl mx-auto space-y-5">
                <div>
                  <h2 className="text-sm font-semibold mb-1">{currentTemplate.label}</h2>
                  <p className="text-xs text-muted-foreground">{currentTemplate.description}</p>
                </div>

                <div className="rounded-lg border border-border bg-card p-4 space-y-4">
                  {/* ── Notification ── */}
                  {selected === "notification" && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Notification Type</Label>
                        <Select
                          value={vars.notification.type}
                          onValueChange={(v) => updateVar("notification", "type", v)}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["info", "success", "warning", "error", "message", "connection", "event"].map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Title</Label>
                        <Input
                          value={vars.notification.title}
                          onChange={(e) => updateVar("notification", "title", e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Message</Label>
                        <Textarea
                          value={vars.notification.message}
                          onChange={(e) => updateVar("notification", "message", e.target.value)}
                          rows={4}
                          className="text-sm resize-none"
                        />
                      </div>
                    </>
                  )}

                  {/* ── Invitation ── */}
                  {selected === "invitation" && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Applicant Email</Label>
                        <Input
                          value={vars.invitation.email}
                          onChange={(e) => updateVar("invitation", "email", e.target.value)}
                          className="h-9 text-sm"
                          placeholder="applicant@example.com"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Job Title</Label>
                        <Input
                          value={vars.invitation.jobTitle}
                          onChange={(e) => updateVar("invitation", "jobTitle", e.target.value)}
                          className="h-9 text-sm"
                          placeholder="Frontend Developer Intern"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Company Name</Label>
                        <Input
                          value={vars.invitation.companyName}
                          onChange={(e) => updateVar("invitation", "companyName", e.target.value)}
                          className="h-9 text-sm"
                          placeholder="TechNova AI"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Invitation Token</Label>
                        <Input
                          value={vars.invitation.token}
                          onChange={(e) => updateVar("invitation", "token", e.target.value)}
                          className="h-9 text-sm"
                          placeholder="abc123xyz"
                        />
                        <p className="text-xs text-muted-foreground">Used to construct the invitation URL in the preview.</p>
                      </div>
                    </>
                  )}

                  {/* ── Digest ── */}
                  {selected === "digest" && (
                    <div className="py-2 text-center text-sm text-muted-foreground">
                      <Newspaper className="h-8 w-8 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">No variables needed</p>
                      <p className="text-xs mt-1">The Weekly Digest pulls live data from the platform database when sent. The preview shows sample data.</p>
                    </div>
                  )}

                  {/* ── Partnership ── */}
                  {selected === "partnership" && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Partner Name</Label>
                        <Input
                          value={vars.partnership.partnerName}
                          onChange={(e) => updateVar("partnership", "partnerName", e.target.value)}
                          className="h-9 text-sm"
                          placeholder="Acme Ventures"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Partner Logo URL</Label>
                        <Input
                          value={vars.partnership.partnerLogo}
                          onChange={(e) => updateVar("partnership", "partnerLogo", e.target.value)}
                          className="h-9 text-sm"
                          placeholder="https://..."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Partner Website</Label>
                        <Input
                          value={vars.partnership.partnerWebsite}
                          onChange={(e) => updateVar("partnership", "partnerWebsite", e.target.value)}
                          className="h-9 text-sm"
                          placeholder="https://..."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Partner Description</Label>
                        <Textarea
                          value={vars.partnership.partnerDescription}
                          onChange={(e) => updateVar("partnership", "partnerDescription", e.target.value)}
                          rows={3}
                          className="text-sm resize-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Benefits for Startups <span className="text-muted-foreground">(one per line)</span></Label>
                        <Textarea
                          value={vars.partnership.benefitsForStartups}
                          onChange={(e) => updateVar("partnership", "benefitsForStartups", e.target.value)}
                          rows={4}
                          className="text-sm resize-none"
                          placeholder={"Access to $250K pre-seed funding\nFree co-working space"}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-xs">CTA Button Label</Label>
                          <Input
                            value={vars.partnership.ctaLabel}
                            onChange={(e) => updateVar("partnership", "ctaLabel", e.target.value)}
                            className="h-9 text-sm"
                            placeholder="Learn More"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">CTA URL</Label>
                          <Input
                            value={vars.partnership.ctaUrl}
                            onChange={(e) => updateVar("partnership", "ctaUrl", e.target.value)}
                            className="h-9 text-sm"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── Auth Emails ── */}
                  {selected === "auth" && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Auth Type</Label>
                        <Select
                          value={vars.auth.authType}
                          onValueChange={(v) => updateVar("auth", "authType", v)}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="magiclink">Magic Link</SelectItem>
                            <SelectItem value="signup">Email Verification (Sign Up)</SelectItem>
                            <SelectItem value="recovery">Password Reset</SelectItem>
                            <SelectItem value="welcome">Welcome Email</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">User Email</Label>
                        <Input
                          value={vars.auth.userEmail}
                          onChange={(e) => updateVar("auth", "userEmail", e.target.value)}
                          className="h-9 text-sm"
                          placeholder="user@example.com"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Token <span className="text-muted-foreground">(for URL preview)</span></Label>
                        <Input
                          value={vars.auth.token}
                          onChange={(e) => updateVar("auth", "token", e.target.value)}
                          className="h-9 text-sm"
                          placeholder="preview-token-abc123"
                        />
                      </div>
                      <div className="rounded-md bg-muted border border-border px-3 py-2.5 text-xs text-muted-foreground">
                        ⚠️ Auth emails are triggered automatically by Supabase auth events. The "Send Test" button is not applicable here — these are handled via the <code className="font-mono">send-auth-email</code> hook.
                      </div>
                    </>
                  )}

                  {/* ── PDF Signature ── */}
                  {selected === "pdf-signature" && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Document Title</Label>
                        <Input
                          value={vars["pdf-signature"].documentTitle}
                          onChange={(e) => updateVar("pdf-signature", "documentTitle", e.target.value)}
                          className="h-9 text-sm"
                          placeholder="Startup Equity Agreement"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Sender Name</Label>
                        <Input
                          value={vars["pdf-signature"].senderName}
                          onChange={(e) => updateVar("pdf-signature", "senderName", e.target.value)}
                          className="h-9 text-sm"
                          placeholder="Alex Johnson"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Access Level</Label>
                        <Select
                          value={vars["pdf-signature"].accessLevel}
                          onValueChange={(v) => updateVar("pdf-signature", "accessLevel", v)}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="view">View</SelectItem>
                            <SelectItem value="sign">Sign</SelectItem>
                            <SelectItem value="edit">Edit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Share Token <span className="text-muted-foreground">(for URL preview)</span></Label>
                        <Input
                          value={vars["pdf-signature"].shareToken}
                          onChange={(e) => updateVar("pdf-signature", "shareToken", e.target.value)}
                          className="h-9 text-sm"
                          placeholder="preview-share-token"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Personal Message <span className="text-muted-foreground">(optional)</span></Label>
                        <Textarea
                          value={vars["pdf-signature"].message}
                          onChange={(e) => updateVar("pdf-signature", "message", e.target.value)}
                          rows={3}
                          className="text-sm resize-none"
                          placeholder="Please review and sign at your earliest convenience."
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Edge function: </span>
                  <code className="font-mono">{currentTemplate.edgeFunction}</code>
                  <span className="ml-2">— changes here update the live preview instantly. Send Test fires the real function.</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
