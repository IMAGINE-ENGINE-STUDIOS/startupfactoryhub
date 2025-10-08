import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import FloatingChat from "./components/FloatingChat";
import RecommendationPopup from "./components/RecommendationPopup";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ProfileSetup from "./pages/ProfileSetup";
import DashboardRouter from "./components/DashboardRouter";
import StartupProfile from "./pages/StartupProfile";
import CommunityFeed from "./pages/CommunityFeed";
import Events from "./pages/Events";
import Messages from "./pages/Messages";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile-setup" element={<ProfileSetup />} />
              <Route path="/dashboard" element={<DashboardRouter />} />
              <Route path="/feed" element={<CommunityFeed />} />
              <Route path="/events" element={<Events />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/profile" element={<StartupProfile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <FloatingChat />
            <RecommendationPopup />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
