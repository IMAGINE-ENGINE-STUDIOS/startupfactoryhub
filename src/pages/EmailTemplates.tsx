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
  AlertTriangle,
  UserPlus,
  MessageSquare,
  Users,
  CalendarCheck,
  Briefcase,
  RefreshCw,
  Lock,
  CheckCheck,
  GraduationCap,
  TrendingUp,
  Building2,
} from "lucide-react";
import MatrixBackground from "@/components/MatrixBackground";

// ─── Template HTML generators (mirrored from edge functions) ────────────────

function generateNotificationHtml(vars: {
  title: string;
  message: string;
  type: string;
}) {
  const { title, message, type } = vars;

  const iconBg =
    type === "error" ? "#dc2626"
    : type === "success" ? "#059669"
    : type === "connection" ? "#7c3aed"
    : type === "message" ? "#2563eb"
    : type === "event" ? "#db2777"
    : "#0ea270";

  // Inline SVG icons — no letters, no emojis
  const svgIcon =
    type === "connection"
      ? `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3z"/><path d="M8 11c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3z"/><path d="M8 13c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/><path d="M16 13c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2c0-2.66-5.33-4-7-4z"/></svg>`
    : type === "message"
      ? `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`
    : type === "event"
      ? `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`
    : type === "success"
      ? `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
    : type === "error"
      ? `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
    : `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;

  const heroIconHtml = `<div style="width:80px;height:80px;margin:0 auto 20px;background:${iconBg};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(14,162,112,0.4);">${svgIcon}</div>`;

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
        ${heroIconHtml}
      </div>
      <div class="content" style="padding-top:24px;">
        <div class="notification-card">
          <span class="notification-type type-${type}">${type}</span>
          <h2 class="title">${title}</h2>
          <div class="message">${message}</div>
          <a href="https://startupfactoryhub.com/dashboard" class="button">View on Platform</a>
        </div>
        <div class="tips-section">
          <div class="tips-title"><span style="display:inline-block;background:#0ea270;color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;letter-spacing:1px;margin-right:6px;">TIP</span></div>
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
    .hero-icon-circle { width: 80px; height: 80px; margin: 0 auto 16px; background: linear-gradient(135deg,#0ea270,#059669); border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(14,162,112,0.4); }
    .hero h2 { color: #fff; font-size: 28px; font-weight: 700; margin-bottom: 8px; }
    .hero p { color: #9ca3af; font-size: 15px; line-height: 1.6; }
    .content { padding: 32px; background: #0f1419; }
    .card { background: #1a1f35; border-radius: 12px; padding: 24px; border: 1px solid rgba(14,162,112,0.2); margin-bottom: 24px; }
    .card-title { color: #0ea270; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #9ca3af; font-size: 14px; }
    .detail-value { color: #f3f4f6; font-size: 14px; font-weight: 600; }
    .status-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #0ea270; margin-right: 6px; vertical-align: middle; }
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
        <div class="badge">[ + ] Application Selected</div>
        <div class="hero-icon-circle"><svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
        <h2>You've Been Chosen!</h2>
        <p>Congratulations — your application stood out. You've been selected to move forward.<br>Create your account to access your tasks and begin your journey.</p>
      </div>
      <div class="content">
        <div class="card">
          <div class="card-title">[&gt;] Application Details</div>
          ${jobTitle ? `<div class="detail-row"><span class="detail-label">Position</span><span class="detail-value">${jobTitle}</span></div>` : ""}
          ${companyName ? `<div class="detail-row"><span class="detail-label">Company</span><span class="detail-value">${companyName}</span></div>` : ""}
          <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value"><span class="status-dot"></span>Selected</span></div>
          <div class="detail-row"><span class="detail-label">Invitation Sent To</span><span class="detail-value">${email}</span></div>
        </div>
        <div class="steps">
          <div class="step"><div class="step-num">1</div><div class="step-text"><h4>Click the button below</h4><p>You'll be taken to the platform to create your account</p></div></div>
          <div class="step"><div class="step-num">2</div><div class="step-text"><h4>Complete your profile</h4><p>Set up your account with your details and skills</p></div></div>
          <div class="step"><div class="step-num">3</div><div class="step-text"><h4>Start your tasks</h4><p>Access your task list and begin contributing immediately</p></div></div>
        </div>
        <div class="cta-section"><a href="${invitationUrl}" class="cta-btn">Accept Invitation &amp; Get Started</a></div>
        <div class="expiry"><span style="font-weight:700;margin-right:4px;">[!]</span> This invitation expires in <strong>48 hours</strong>. Please accept it as soon as possible.</div>
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

  const sectionAccent = (color: string) =>
    `<span style="display:inline-block;width:12px;height:12px;background:${color};border-radius:2px;margin-right:8px;vertical-align:middle;"></span>`;

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
      <div class="mock-badge"><span style="font-weight:800;margin-right:4px;">[!]</span> Preview Mode — Sample data shown. Live digest pulls real platform data.</div>
      <div class="header">
        <img src="https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png" alt="SFH" />
        <h1>Startup Factory Hub</h1>
        <p>Your Weekly Platform Digest</p>
      </div>
      <div class="hero">
        <div class="week-badge">Weekly Digest</div>
        <h2>Hi ${mockData.recipientName}! Here's what's new</h2>
        <p>${mockData.startups.length + mockData.mentors.length + mockData.investors.length} new members joined the platform this week</p>
      </div>
      <div class="stats-row">
        <div class="stat"><div class="stat-num">${mockData.startups.length}</div><div class="stat-label">Startups</div></div>
        <div class="stat"><div class="stat-num">${mockData.mentors.length}</div><div class="stat-label">Mentors</div></div>
        <div class="stat"><div class="stat-num">${mockData.investors.length}</div><div class="stat-label">Investors</div></div>
        <div class="stat"><div class="stat-num">${mockData.resources.length + mockData.events.length}</div><div class="stat-label">Resources &amp; Events</div></div>
      </div>
      <div class="content">
        <div class="section">
          <div class="section-header">${sectionAccent("#0ea270")}New Startups <span class="count">${mockData.startups.length} new</span></div>
          <div class="section-content">${mockData.startups.map(s => `<div class="item">• ${s}</div>`).join("")}</div>
        </div>
        <div class="section">
          <div class="section-header">${sectionAccent("#2563eb")}New Mentors <span class="count">${mockData.mentors.length} new</span></div>
          <div class="section-content">${mockData.mentors.map(m => `<div class="item">• ${m}</div>`).join("")}</div>
        </div>
        <div class="section">
          <div class="section-header">${sectionAccent("#d97706")}New Investors <span class="count">${mockData.investors.length} new</span></div>
          <div class="section-content">${mockData.investors.map(i => `<div class="item">• ${i}</div>`).join("")}</div>
        </div>
        <div class="section">
          <div class="section-header">${sectionAccent("#7c3aed")}New Resources <span class="count">${mockData.resources.length} new</span></div>
          <div class="section-content">${mockData.resources.map(r => `<div class="item">• ${r}</div>`).join("")}</div>
        </div>
        <div class="section">
          <div class="section-header">${sectionAccent("#db2777")}Upcoming Events <span class="count">${mockData.events.length} new</span></div>
          <div class="section-content">${mockData.events.map(e => `<div class="item">• ${e}</div>`).join("")}</div>
        </div>
        <div class="cta-section"><a href="https://startupfactoryhub.com/dashboard" class="cta-btn">Explore the Platform</a></div>
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
    .map((b) => `<li><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#0ea270;flex-shrink:0;margin-right:10px;margin-top:2px;"></span>${b.trim()}</li>`)
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
    .partner-placeholder { width: 64px; height: 64px; border-radius: 12px; background: rgba(14,162,112,0.2); border: 2px solid rgba(14,162,112,0.4); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; color: #0ea270; font-family: monospace; }
    .partnership-banner h2 { color: #f3f4f6; font-size: 24px; font-weight: 800; margin: 16px 0 8px; }
    .partnership-banner p { color: #9ca3af; font-size: 14px; line-height: 1.6; }
    .content { padding: 28px 32px; background: #0f1419; }
    .card { background: #1a1f35; border-radius: 12px; padding: 24px; border: 1px solid rgba(14,162,112,0.2); margin-bottom: 20px; }
    .card-label { color: #0ea270; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .card p { color: #d1d5db; font-size: 14px; line-height: 1.7; }
    .benefits-list { list-style: none; }
    .benefits-list li { color: #d1d5db; font-size: 14px; padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: flex-start; }
    .benefits-list li:last-child { border-bottom: none; }
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
        <div class="partnership-badge">[ + ] New Partnership</div>
        <div class="logos-row">
          <img class="sfh-logo" src="https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png" alt="SFH" />
          <span class="plus">×</span>
          ${partnerLogo
            ? `<img class="partner-logo" src="${partnerLogo}" alt="${partnerName}" />`
            : `<div class="partner-placeholder">CO</div>`}
        </div>
        <h2>SFH × ${partnerName || "Partner Name"}</h2>
        <p>We're excited to announce a new partnership that brings more value to our community!</p>
      </div>
      <div class="content">
        <div class="card">
          <div class="card-label">About ${partnerName || "Partner"}</div>
          <p>${partnerDescription || "Partner description goes here."}</p>
          ${partnerWebsite ? `<p style="margin-top:12px"><a href="${partnerWebsite}" style="color:#0ea270;text-decoration:none;font-weight:600;">Visit their website &rarr;</a></p>` : ""}
        </div>
        ${benefitsList ? `<div class="card"><div class="card-label">Benefits for You</div><ul class="benefits-list">${benefitsList}</ul></div>` : ""}
        <div class="cta-section"><a href="${ctaUrl || "https://startupfactoryhub.com/dashboard"}" class="cta-btn">${ctaLabel || "Learn More"}</a></div>
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

function generateWeeklyWelcomeHtml() {
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
    .hero { background: linear-gradient(135deg,#1a1f35,#0f1419); padding: 36px 32px; text-align: center; }
    .hero-badge { display: inline-block; background: rgba(14,162,112,0.15); border: 1px solid rgba(14,162,112,0.4); color: #0ea270; padding: 6px 20px; border-radius: 50px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }
    .hero h2 { color: #f3f4f6; font-size: 24px; font-weight: 800; margin-bottom: 8px; }
    .hero p { color: #9ca3af; font-size: 14px; line-height: 1.6; }
    .partners-row { display: flex; align-items: center; justify-content: center; gap: 24px; margin: 28px 0 20px; flex-wrap: wrap; }
    .partner-card { background: rgba(255,255,255,0.06); border-radius: 14px; padding: 16px 24px; text-align: center; border: 1px solid rgba(255,255,255,0.1); }
    .partner-card img { height: 40px; max-width: 120px; object-fit: contain; margin-bottom: 8px; }
    .partner-card .name { color: #e5e7eb; font-size: 13px; font-weight: 600; }
    .partner-card .stat { color: #0ea270; font-size: 20px; font-weight: 800; margin-top: 4px; }
    .partner-card .stat-label { color: #9ca3af; font-size: 11px; }
    .content { padding: 28px 32px; background: #0f1419; }
    .card { background: #1a1f35; border-radius: 12px; padding: 24px; border: 1px solid rgba(14,162,112,0.2); margin-bottom: 20px; }
    .card-label { color: #0ea270; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .card p { color: #d1d5db; font-size: 14px; line-height: 1.7; }
    .benefits-list { list-style: none; }
    .benefits-list li { color: #d1d5db; font-size: 14px; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: flex-start; gap: 10px; }
    .benefits-list li:last-child { border-bottom: none; }
    .benefits-list li::before { content: '✅'; flex-shrink: 0; }
    .cta-section { text-align: center; padding: 16px 0 8px; }
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
        <p>Weekly Platform Update</p>
      </div>

      <div class="hero">
        <div class="hero-badge">🏢 New This Week</div>
        <h2>Welcome to Startup Factory Hub!</h2>
        <p>Hi <strong>Member</strong>, this week we've partnered with <strong>IWG</strong> and <strong>HSBC</strong> to bring you incredible workspace and banking benefits!</p>

        <div class="partners-row">
             <div class="partner-card">
             <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/HSBC_logo_%282018%29.svg/300px-HSBC_logo_%282018%29.svg.png" alt="HSBC" style="height:40px;max-width:120px;object-fit:contain;margin-bottom:8px;" />
             <div class="name">HSBC Innovation Banking</div>
             <div class="stat">USA</div>
             <div class="stat-label">Available Region</div>
           </div>
           <div class="partner-card">
             <img src="https://logo.clearbit.com/iwgplc.com" alt="IWG" style="height:40px;max-width:120px;object-fit:contain;margin-bottom:8px;" />
             <div class="name">IWG</div>
             <div class="stat">130+</div>
             <div class="stat-label">Countries Worldwide</div>
           </div>
        </div>
      </div>

      <div class="content">
        <div class="card">
          <div class="card-label">🏢 Office Spaces Through IWG</div>
          <p>Through our subscription program, you now have access to <strong>5,800+ flexible workspaces worldwide</strong> via IWG (International Workplace Group). Whether you need a hot desk, private office, or meeting room — we've got you covered in cities across the globe.</p>
        </div>

        <div class="card">
          <div class="card-label">🏦 Free Banking with HSBC</div>
          <p>We've partnered with <strong>HSBC Innovation Banking</strong> to offer <strong>free banking accounts</strong> to our startup community! Access world-class banking services designed specifically for startups and scaling businesses across <strong>130+ locations</strong>.</p>
        </div>

        <div class="card">
          <div class="card-label">🎁 What You Get</div>
          <ul class="benefits-list">
            <li>Access to 5,800+ IWG office spaces worldwide through our subscription</li>
            <li>Free HSBC Innovation Banking account for your startup</li>
            <li>Exclusive member discounts on workspace bookings</li>
            <li>Premium banking services tailored for startups</li>
            <li>Global network of professional workspaces and banking support</li>
          </ul>
        </div>

        <div class="cta-section">
          <a href="https://startupfactoryhub.com/dashboard" class="cta-btn">🚀 Go to Resource Dashboard</a>
        </div>
      </div>

      <div class="footer">
        <p>You're receiving this as a valued member of Startup Factory Hub.</p>
        <p style="margin-top:8px">© 2025 <a href="https://startupfactoryhub.com">Startup Factory Hub</a> · <a href="https://www.linkedin.com/company/startup-factory-hub/?viewAsMember=true">LinkedIn</a> · All rights reserved</p>
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

  // Inline SVG icons per auth type — no letters
  const authSvgIcon = authType === "magiclink"
    ? `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>`
    : authType === "signup"
    ? `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`
    : authType === "recovery"
    ? `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
    : `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

  const configs: Record<string, { subject: string; iconBg: string; headline: string; body: string; cta: string; actionUrl: string }> = {
    magiclink: {
      subject: "Your Magic Link",
      iconBg: "#0ea270",
      headline: "Sign in to Startup Factory Hub",
      body: "Click the button below to securely sign in. This magic link will expire in 1 hour.",
      cta: "Sign In Securely",
      actionUrl: `${baseUrl}/auth/v1/verify?token=${token || "PREVIEW_TOKEN"}&type=magiclink`,
    },
    signup: {
      subject: "Verify Your Email",
      iconBg: "#2563eb",
      headline: "Welcome! Verify your email to get started",
      body: "Thank you for signing up. Please verify your email address to activate your account and access all platform features.",
      cta: "Verify Email Address",
      actionUrl: `${baseUrl}/auth/v1/verify?token=${token || "PREVIEW_TOKEN"}&type=signup`,
    },
    recovery: {
      subject: "Reset Your Password",
      iconBg: "#d97706",
      headline: "Reset your password",
      body: "You requested a password reset for your Startup Factory Hub account. Click below to choose a new password. This link expires in 1 hour.",
      cta: "Reset Password",
      actionUrl: `${baseUrl}/auth/v1/verify?token=${token || "PREVIEW_TOKEN"}&type=recovery`,
    },
    welcome: {
      subject: "Welcome to SFH!",
      iconBg: "#059669",
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
    .hero-icon-circle { width: 80px; height: 80px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 8px 24px rgba(14,162,112,0.4); }
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
        <div class="hero-icon-circle" style="background:${cfg.iconBg};">${authSvgIcon}</div>
        <h2>${cfg.headline}</h2>
        <p>${cfg.body}</p>
      </div>
      <div class="content">
        <div class="cta-section">
          <a href="${cfg.actionUrl}" class="cta-btn">${cfg.cta}</a>
        </div>
        ${authType !== "welcome" ? `<div class="expiry"><span style="font-weight:800;margin-right:4px;">[!]</span> This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.</div>` : ""}
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

  const pdfSvgIcon = accessLevel === "sign"
    ? `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>`
    : accessLevel === "edit"
    ? `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`
    : `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;
  const iconBg = accessLevel === "sign" ? "#0ea270" : accessLevel === "edit" ? "#2563eb" : "#7c3aed";

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
    .hero-icon-circle { width: 72px; height: 72px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 30px; font-weight: 800; color: #fff; font-family: monospace; margin-bottom: 12px; box-shadow: 0 8px 24px rgba(14,162,112,0.4); }
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
        <div class="hero-badge">Document Shared</div>
        <div class="hero-icon-circle" style="background:${iconBg};">${pdfSvgIcon}</div>
        <h2>${actionText} Request</h2>
        <p><strong style="color:#f3f4f6">${senderName || "Someone"}</strong> ${description}</p>
      </div>
      <div class="content">
        <div class="card">
          <div class="card-label">Document Details</div>
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
          <a href="${shareUrl}" class="cta-btn">${actionText}</a>
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
  // ── Notification-based (all use send-notification-email) ──
  {
    id: "connection-request",
    label: "Connection Request",
    icon: UserPlus,
    description: "connections INSERT — sent to the addressee",
    edgeFunction: "send-notification-email",
    trigger: "connections INSERT",
  },
  {
    id: "connection-accepted",
    label: "Connection Accepted",
    icon: CheckCheck,
    description: "connections UPDATE (status=accepted) — sent to requester",
    edgeFunction: "send-notification-email",
    trigger: "connections UPDATE",
  },
  {
    id: "new-message",
    label: "New Message",
    icon: MessageSquare,
    description: "messages INSERT — sent to receiver",
    edgeFunction: "send-notification-email",
    trigger: "messages INSERT",
  },
  {
    id: "mentorship-request",
    label: "Mentorship Request",
    icon: Users,
    description: "mentoring_sessions INSERT (pending) — sent to mentor",
    edgeFunction: "send-notification-email",
    trigger: "mentoring_sessions INSERT (pending)",
  },
  {
    id: "session-booked",
    label: "Session Booked",
    icon: CalendarCheck,
    description: "mentoring_sessions INSERT — sent to mentor & mentee",
    edgeFunction: "send-notification-email",
    trigger: "mentoring_sessions INSERT",
  },
  {
    id: "cohort-acceptance",
    label: "Cohort Acceptance",
    icon: GraduationCap,
    description: "cohort_startups INSERT — sent to company owner",
    edgeFunction: "send-notification-email",
    trigger: "cohort_startups INSERT",
  },
  {
    id: "cohort-status-change",
    label: "Cohort Status Change",
    icon: RefreshCw,
    description: "accelerator_cohorts UPDATE (status) — sent to all enrolled",
    edgeFunction: "send-notification-email",
    trigger: "accelerator_cohorts UPDATE",
  },
  {
    id: "job-application-received",
    label: "Job Application Received",
    icon: Briefcase,
    description: "job_applications INSERT — sent to company owner",
    edgeFunction: "send-notification-email",
    trigger: "job_applications INSERT",
  },
  {
    id: "application-status-update",
    label: "Application Status Update",
    icon: TrendingUp,
    description: "job_applications UPDATE (status) — sent to applicant",
    edgeFunction: "send-notification-email",
    trigger: "job_applications UPDATE",
  },
  {
    id: "event-registration",
    label: "Event Registration",
    icon: Bell,
    description: "event_registrations INSERT — sent to registrant",
    edgeFunction: "send-notification-email",
    trigger: "event_registrations INSERT",
  },
  // ── Auth emails ──
  {
    id: "account-verification",
    label: "Account Verification",
    icon: KeyRound,
    description: "auth signup / magic-link — triggered by Supabase auth",
    edgeFunction: "send-auth-email",
    trigger: "auth signup/magic-link",
  },
  {
    id: "password-reset",
    label: "Password Reset",
    icon: Lock,
    description: "auth recovery — triggered by Supabase auth",
    edgeFunction: "send-auth-email",
    trigger: "auth recovery",
  },
  // ── Other platform emails ──
  {
    id: "invitation",
    label: "Application Invitation",
    icon: Mail,
    description: "Sent when an applicant is selected for a job/internship",
    edgeFunction: "send-application-invitation",
    trigger: "manual",
  },
  {
    id: "digest",
    label: "Weekly Digest",
    icon: Newspaper,
    description: "Monday morning summary of new platform activity",
    edgeFunction: "weekly-digest",
    trigger: "cron Monday 9AM UTC",
  },
  {
    id: "partnership",
    label: "Partnership Announcement",
    icon: Handshake,
    description: "Broadcast to all users when a new partner joins",
    edgeFunction: "send-partnership-announcement",
    trigger: "manual broadcast",
  },
  {
    id: "weekly-welcome",
    label: "Weekly Welcome — IWG & HSBC",
    icon: Building2,
    description: "Broadcast announcing IWG & HSBC partnership benefits",
    edgeFunction: "send-weekly-welcome",
    trigger: "manual broadcast",
  },
  {
    id: "pdf-signature",
    label: "PDF Signature Request",
    icon: FileSignature,
    description: "Sent when a user shares a document for viewing or signing",
    edgeFunction: "send-pdf-signature-request",
    trigger: "manual",
  },
] as const;

type TemplateId = (typeof TEMPLATES)[number]["id"];

// ─── Default variable states ─────────────────────────────────────────────────

const defaultVars = {
  "connection-request": {
    to: "",
    title: "New Connection Request",
    message: "Sarah Chen, a Startup Mentor, wants to connect with you. Building your network is key to success — accept their request and start collaborating!",
    type: "connection",
  },
  "connection-accepted": {
    to: "",
    title: "Connection Accepted",
    message: "Sarah Chen accepted your connection request. You are now connected — start a conversation!",
    type: "success",
  },
  "new-message": {
    to: "",
    title: "New Message",
    message: "Alex Johnson sent you a message on the platform. Log in to read and reply.",
    type: "message",
  },
  "mentorship-request": {
    to: "",
    title: "New Mentorship Request",
    message: "Jordan Park has requested mentorship from you. Review their profile and accept or decline the request.",
    type: "info",
  },
  "session-booked": {
    to: "",
    title: "Mentoring Session Booked",
    message: "Jordan Park has scheduled a mentoring session with you for Monday, 24 February 2025 at 10:00 AM UTC. Please log in to confirm and prepare.",
    type: "event",
  },
  "cohort-acceptance": {
    to: "",
    title: "Congratulations! Accepted into Cohort",
    message: "TechNova AI has been officially accepted into the Spring 2025 Cohort at Startup Factory Hub! Welcome to the program! Log in to view your cohort details, resources, and next steps.",
    type: "success",
  },
  "cohort-status-change": {
    to: "",
    title: "Applications Are Now Open: Spring 2025",
    message: "The cohort \"Spring 2025\" status has changed to: Applications Are Now Open. Log in to the platform for more details.",
    type: "info",
  },
  "job-application-received": {
    to: "",
    title: "New Job Application",
    message: "Jordan Park applied for Frontend Developer Intern at your company. Log in to review their application.",
    type: "info",
  },
  "application-status-update": {
    to: "",
    title: "Application Update",
    message: "Your application for Frontend Developer Intern has been accepted. Congratulations — log in to view next steps!",
    type: "success",
  },
  "event-registration": {
    to: "",
    title: "Event Registration Confirmed",
    message: "You have successfully registered for the AI & Startups Summit 2025. We look forward to seeing you there!",
    type: "success",
  },
  "account-verification": {
    to: "",
    authType: "signup",
    userEmail: "user@example.com",
    token: "preview-token-abc123",
  },
  "password-reset": {
    to: "",
    authType: "recovery",
    userEmail: "user@example.com",
    token: "preview-token-abc123",
  },
  notification: {
    to: "",
    title: "You have a new connection request!",
    message: "Sarah Chen wants to connect with you.",
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
  "weekly-welcome": {
    to: "",
  },
};

// ─── Template group helpers ──────────────────────────────────────────────────

const NOTIFICATION_IDS: TemplateId[] = [
  "connection-request", "connection-accepted", "new-message", "mentorship-request",
  "session-booked", "cohort-acceptance", "cohort-status-change",
  "job-application-received", "application-status-update", "event-registration",
];
const AUTH_IDS: TemplateId[] = ["account-verification", "password-reset"];

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function EmailTemplates() {
  const navigate = useNavigate();
  const { role, loading } = useUserRole();
  const { toast } = useToast();

  const [selected, setSelected] = useState<TemplateId>("connection-request");
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
    if (NOTIFICATION_IDS.includes(selected)) {
      const v = vars[selected] as { title: string; message: string; type: string };
      return generateNotificationHtml(v);
    }
    if (AUTH_IDS.includes(selected)) {
      const v = vars[selected] as { authType: string; userEmail: string; token: string };
      return generateAuthEmailHtml(v);
    }
    if (selected === "invitation") return generateInvitationHtml(vars.invitation);
    if (selected === "digest") return generateWeeklyDigestHtml();
    if (selected === "partnership") return generatePartnershipHtml(vars.partnership);
    if (selected === "pdf-signature") return generatePdfSignatureHtml(vars["pdf-signature"]);
    if (selected === "weekly-welcome") return generateWeeklyWelcomeHtml();
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

      if (NOTIFICATION_IDS.includes(selected)) {
        const v = vars[selected] as { title: string; message: string; type: string };
        payload = { to: toEmail, title: v.title, message: v.message, type: v.type };
      } else if (AUTH_IDS.includes(selected)) {
        toast({
          title: "Auth emails",
          description: "Auth emails are triggered automatically by Supabase — they cannot be sent manually from here.",
          variant: "default",
        });
        setSending(false);
        return;
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
      } else if (selected === "weekly-welcome") {
        payload = { targetEmails: [toEmail] };
      }

      const { error } = await supabase.functions.invoke(currentTemplate.edgeFunction, {
        body: payload,
      });

      if (error) throw error;

      toast({
        title: "Test email sent!",
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
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Dark base layer so matrix renders on black, not the blue theme background */}
      <div className="absolute inset-0 bg-black z-0" />

      {/* Matrix background animation */}
      <MatrixBackground />

      {/* Geometric grid overlay */}
      <div
        className="absolute inset-0 z-[1] opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(hsl(160 84% 39% / 0.08) 1px, transparent 1px),
                            linear-gradient(90deg, hsl(160 84% 39% / 0.08) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Radial gradient vignette */}
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, hsl(var(--background) / 0.6) 100%)",
        }}
      />

      {/* Page content */}
      <div className="relative z-10 flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <header className="border-b border-border bg-card/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between shrink-0">
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
          <aside className="w-72 border-r border-border bg-card/80 backdrop-blur-sm flex flex-col shrink-0 overflow-y-auto">
            <div className="p-4">
              {/* Notification-based group */}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Automated Notifications</p>
              <div className="space-y-0.5 mb-4">
                {TEMPLATES.filter(t => NOTIFICATION_IDS.includes(t.id as TemplateId)).map((t) => {
                  const Icon = t.icon;
                  const isActive = selected === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelected(t.id)}
                      className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors flex items-start gap-3 ${
                        isActive
                          ? "bg-primary/10 border border-primary/30 text-primary"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${isActive ? "text-primary" : ""}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight">{t.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono opacity-70 truncate">{t.trigger}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Auth group */}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Auth Emails</p>
              <div className="space-y-0.5 mb-4">
                {TEMPLATES.filter(t => AUTH_IDS.includes(t.id as TemplateId)).map((t) => {
                  const Icon = t.icon;
                  const isActive = selected === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelected(t.id)}
                      className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors flex items-start gap-3 ${
                        isActive
                          ? "bg-primary/10 border border-primary/30 text-primary"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${isActive ? "text-primary" : ""}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight">{t.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono opacity-70 truncate">{t.trigger}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Other platform emails */}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Platform Emails</p>
              <div className="space-y-0.5">
                {TEMPLATES.filter(t => !NOTIFICATION_IDS.includes(t.id as TemplateId) && !AUTH_IDS.includes(t.id as TemplateId)).map((t) => {
                  const Icon = t.icon;
                  const isActive = selected === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelected(t.id)}
                      className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors flex items-start gap-3 ${
                        isActive
                          ? "bg-primary/10 border border-primary/30 text-primary"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${isActive ? "text-primary" : ""}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight">{t.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-tight line-clamp-1">{t.description}</p>
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
              <div className="border-b border-border bg-card/80 backdrop-blur-sm px-6 py-3 flex items-center justify-between shrink-0">
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
                    {/* ── Notification-based templates (shared fields) ── */}
                    {NOTIFICATION_IDS.includes(selected) && (() => {
                      const v = vars[selected] as { title: string; message: string; type: string };
                      return (
                        <>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Title</Label>
                            <Input
                              value={v.title}
                              onChange={(e) => updateVar(selected, "title", e.target.value)}
                              className="h-9 text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Message</Label>
                            <Textarea
                              value={v.message}
                              onChange={(e) => updateVar(selected, "message", e.target.value)}
                              rows={4}
                              className="text-sm resize-none"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Notification Type <span className="text-muted-foreground">(controls icon + colour)</span></Label>
                            <Select
                              value={v.type}
                              onValueChange={(val) => updateVar(selected, "type", val)}
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
                        </>
                      );
                    })()}

                    {/* ── Auth templates ── */}
                    {AUTH_IDS.includes(selected) && (() => {
                      const v = vars[selected] as { authType: string; userEmail: string; token: string };
                      return (
                        <>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Auth Type</Label>
                            <Select
                              value={v.authType}
                              onValueChange={(val) => updateVar(selected, "authType", val)}
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
                              value={v.userEmail}
                              onChange={(e) => updateVar(selected, "userEmail", e.target.value)}
                              className="h-9 text-sm"
                              placeholder="user@example.com"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Token <span className="text-muted-foreground">(for URL preview)</span></Label>
                            <Input
                              value={v.token}
                              onChange={(e) => updateVar(selected, "token", e.target.value)}
                              className="h-9 text-sm"
                              placeholder="preview-token-abc123"
                            />
                          </div>
                          <div className="rounded-md bg-muted border border-border px-3 py-2.5 text-xs text-muted-foreground flex items-start gap-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 mt-0.5 shrink-0" />
                            Auth emails are triggered automatically by Supabase auth events. The "Send Test" button is not applicable here — these are handled via the <code className="font-mono">send-auth-email</code> hook.
                          </div>
                        </>
                      );
                    })()}

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
    </div>
  );
}
