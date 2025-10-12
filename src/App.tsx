import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import FloatingChat from "./components/FloatingChat";
import RecommendationPopup from "./components/RecommendationPopup";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Code-split heavy pages
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));
const DashboardRouter = lazy(() => import("./components/DashboardRouter"));
const StartupProfile = lazy(() => import("./pages/StartupProfile"));
const CommunityFeed = lazy(() => import("./pages/CommunityFeed"));
const Events = lazy(() => import("./pages/Events"));
const Messages = lazy(() => import("./pages/Messages"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Explore = lazy(() => import("./pages/Explore"));
const MentoringSessions = lazy(() => import("./pages/MentoringSessions"));
const Calendar = lazy(() => import("./pages/Calendar"));

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
                  <Route path="/feed" element={<CommunityFeed />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/events" element={<Calendar />} />
                  <Route path="/mentoring-sessions" element={<Calendar />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/profile" element={<StartupProfile />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
              <FloatingChat />
              <RecommendationPopup />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
