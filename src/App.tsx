import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import ErrorBoundary from "./components/ErrorBoundary";
import FloatingChat from "./components/FloatingChat";
import DJAudioEngine from "./components/dj/DJAudioEngine";
import { useWebsiteVisitorTracking } from "./hooks/useWebsiteVisitorTracking";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ProfileSetup from "./pages/ProfileSetup";
import DashboardRouter from "./components/DashboardRouter";

// Code-split heavy pages
const Tools = lazy(() => import("./pages/Tools"));
const LightPaper = lazy(() => import("./pages/LightPaper"));
const Guidelines = lazy(() => import("./pages/Guidelines"));
const PublicInternshipApplication = lazy(() => import("./pages/PublicInternshipApplication"));
const PublicJobApplicationPage = lazy(() => import("./pages/PublicJobApplicationPage"));
const AcceptInvitation = lazy(() => import("./pages/AcceptInvitation"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const About = lazy(() => import("./pages/About"));
const Blog = lazy(() => import("./pages/Blog"));
const Sponsorship = lazy(() => import("./pages/Sponsorship"));
const PublicCohortApplication = lazy(() => import("./pages/PublicCohortApplication"));
const Marketing = lazy(() => import("./pages/Marketing"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const CorporatePartners = lazy(() => import("./pages/CorporatePartners"));
const JoinAsMentor = lazy(() => import("./pages/JoinAsMentor"));
const JoinAsAdvisor = lazy(() => import("./pages/JoinAsAdvisor"));
const JapanAccelerator = lazy(() => import("./pages/JapanAccelerator"));
const PublicEventRegistration = lazy(() => import("./pages/PublicEventRegistration"));
const PublicResources = lazy(() => import("./pages/PublicResources"));
const Deck = lazy(() => import("./pages/Deck"));
const DeckPublic = lazy(() => import("./pages/DeckPublic"));
const Hubs = lazy(() => import("./pages/Hubs"));
const HubsLab = lazy(() => import("./pages/HubsLab"));
const PublicHubApplication = lazy(() => import("./pages/PublicHubApplication"));
const MVPProgram = lazy(() => import("./pages/MVPProgram"));
const EmailTemplates = lazy(() => import("./pages/EmailTemplates"));
const DistrictDashboard = lazy(() => import("./pages/DistrictDashboard"));
const ReferralProgram = lazy(() => import("./pages/ReferralProgram"));
const ReferralRedirect = lazy(() => import("./pages/ReferralRedirect"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const InstallApp = lazy(() => import("./pages/InstallApp"));
const OfficialMentorInvite = lazy(() => import("./pages/OfficialMentorInvite"));
const OfficialProgram = lazy(() => import("./pages/OfficialProgram"));
const FourDMap = lazy(() => import("./pages/4DMap"));
const ArtemisWatchParty = lazy(() => import("./pages/ArtemisWatchParty"));
const PublicBooking = lazy(() => import("./pages/PublicBooking"));
const HotDealsPortal = lazy(() => import("./pages/HotDealsPortal"));
const HotDealsFeedbackPage = lazy(() => import("./pages/HotDealsFeedbackPage"));
const Brochure = lazy(() => import("./pages/Brochure"));
const BrochureES = lazy(() => import("./pages/BrochureES"));
const RicardoFontCV = lazy(() => import("./pages/RicardoFontCV"));
const KhaliaPadillaCV = lazy(() => import("./pages/KhaliaPadillaCV"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

// Loading component for Suspense
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const WebsiteTracker = () => {
  useWebsiteVisitorTracking();
  return null;
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <LanguageProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
                }}
              >
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/profile-setup" element={<ProfileSetup />} />
                    <Route path="/dashboard" element={<DashboardRouter />} />
                    <Route path="/tools" element={<Tools />} />
                    <Route path="/lightpaper" element={<LightPaper />} />
                    <Route path="/guidelines" element={<Guidelines />} />
                    <Route path="/jobs/:jobId/apply" element={<PublicJobApplicationPage />} />
                    <Route path="/internships/:internshipId/apply" element={<PublicInternshipApplication />} />
                    <Route path="/accept-invitation" element={<AcceptInvitation />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route path="/cookie-policy" element={<CookiePolicy />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/sponsorship" element={<Sponsorship />} />
                    <Route path="/cohorts/:cohortId/apply" element={<PublicCohortApplication />} />
                    <Route path="/marketing" element={<Marketing />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/partners" element={<CorporatePartners />} />
                    <Route path="/join/mentor" element={<JoinAsMentor />} />
                    <Route path="/join/advisor" element={<JoinAsAdvisor />} />
                    <Route path="/japan-accelerator" element={<JapanAccelerator />} />
                    <Route path="/events/:eventId/register" element={<PublicEventRegistration />} />
                    <Route path="/resources" element={<PublicResources />} />
                    <Route path="/deck" element={<Deck />} />
                    <Route path="/overview" element={<DeckPublic />} />
                    <Route path="/hubs" element={<Hubs />} />
                    <Route path="/hubs-lab" element={<HubsLab />} />
                    <Route path="/hubs/apply" element={<PublicHubApplication />} />
                    <Route path="/mvp-program" element={<MVPProgram />} />
                    <Route path="/emails" element={<EmailTemplates />} />
                    <Route path="/district/:districtId" element={<DistrictDashboard />} />
                    <Route path="/referral" element={<ReferralProgram />} />
                    <Route path="/ref/:code" element={<ReferralRedirect />} />
                    <Route path="/install" element={<InstallApp />} />
                    <Route path="/official-mentor-invite" element={<OfficialMentorInvite />} />
                    <Route path="/official" element={<OfficialProgram />} />
                    <Route path="/4d-map" element={<FourDMap />} />
                    <Route path="/artemis-watch-party" element={<ArtemisWatchParty />} />
                    <Route path="/meet/:slug" element={<PublicBooking />} />
                    <Route path="/hot-deals-space" element={<HotDealsPortal />} />
                    <Route path="/hot-deals/feedback" element={<HotDealsFeedbackPage />} />
                    <Route path="/brochure" element={<Brochure />} />
                    <Route path="/brochurees" element={<BrochureES />} />
                    <Route path="/ricardo-font-cv" element={<RicardoFontCV />} />
                    <Route path="/khalia-padilla-cv" element={<KhaliaPadillaCV />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                <WebsiteTracker />
                <FloatingChat />
                <DJAudioEngine />
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;