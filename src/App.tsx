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
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import ProfileSetup from "./pages/ProfileSetup";
import DashboardRouter from "./components/DashboardRouter";

// Code-split heavy pages
const Tools = lazy(() => import("./pages/Tools"));
const LightPaper = lazy(() => import("./pages/LightPaper"));
const Guidelines = lazy(() => import("./pages/Guidelines"));
const PublicJobApplication = lazy(() => import("./pages/PublicJobApplication"));
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
                    <Route path="/profile-setup" element={<ProfileSetup />} />
                    <Route path="/dashboard" element={<DashboardRouter />} />
                    <Route path="/tools" element={<Tools />} />
                    <Route path="/lightpaper" element={<NotFound />} />
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
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                <FloatingChat />
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;