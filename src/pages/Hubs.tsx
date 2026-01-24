import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { HubsMapView } from '@/components/hubs/HubsMapView';
import { HubsSearchFilters } from '@/components/hubs/HubsSearchFilters';
import { HubsWorkspaceCard } from '@/components/hubs/HubsWorkspaceCard';
import { HubsBookingModal } from '@/components/hubs/HubsBookingModal';
import { HubsDetailPanel } from '@/components/hubs/HubsDetailPanel';
import { HubsAIAssistant } from '@/components/hubs/HubsAIAssistant';
import { useHubsSearch, WorkspaceFilters, Workspace } from '@/hooks/useHubsSearch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Loader2, 
  Building2, 
  Menu, 
  ChevronLeft, 
  ChevronRight,
  Search,
  Bot,
  X
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import MatrixBackground from '@/components/MatrixBackground';
import logo from '@/assets/logo.png';

const Hubs = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [filters, setFilters] = useState<WorkspaceFilters>({
    workspaceType: [],
    amenities: [],
  });

  const { data: workspaces, isLoading, error, refetch } = useHubsSearch(filters);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { state: { from: '/hubs' } });
    }
  }, [user, authLoading, navigate]);

  // Handle booking success from Stripe redirect
  useEffect(() => {
    const bookingStatus = searchParams.get('booking');
    if (bookingStatus === 'success') {
      toast({
        title: "Booking Confirmed!",
        description: "Check your email for booking details",
      });
      // Clean up URL
      window.history.replaceState({}, '', '/hubs');
    } else if (bookingStatus === 'cancelled') {
      toast({
        title: "Booking Cancelled",
        description: "Your booking was not completed",
        variant: "destructive",
      });
      window.history.replaceState({}, '', '/hubs');
    }
  }, [searchParams]);

  const handleWorkspaceSelect = (workspace: Workspace | null) => {
    setSelectedWorkspace(workspace);
  };

  const handleBookWorkspace = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setShowBookingModal(true);
  };

  const handleAISearch = (searchFilters: Partial<WorkspaceFilters>) => {
    setFilters(prev => ({ ...prev, ...searchFilters }));
  };

  const handleSearchChange = (search: string) => {
    setSearchQuery(search);
    setFilters(prev => ({ ...prev, search }));
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Matrix Background */}
      <MatrixBackground />
      
      {/* Map View - Full viewport */}
      <HubsMapView
        workspaces={workspaces || []}
        selectedWorkspace={selectedWorkspace}
        onWorkspaceSelect={handleWorkspaceSelect}
        onWorkspaceBook={handleBookWorkspace}
      />

      {/* Header - Centered Title/Logo */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 pointer-events-none">
        <div className="flex items-center justify-center pointer-events-auto">
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => navigate('/dashboard')}
          >
            <img src={logo} alt="Startup Factory Hub" className="w-10 h-10" />
            <span className="text-lg font-bold text-white drop-shadow-lg">
              Startup Hubs
            </span>
          </div>
        </div>
        
        {/* AI Assistant Button - Top Right */}
        <div className="absolute top-4 right-4 pointer-events-auto">
          <Button
            variant="ghost"
            onClick={() => setShowAIAssistant(!showAIAssistant)}
            className={cn(
              "tech-card border-0 backdrop-blur-xl bg-white/10 dark:bg-black/20 rounded-xl hover:bg-white/20",
              showAIAssistant && "bg-primary/90 hover:bg-primary"
            )}
          >
            <Bot className="w-4 h-4 mr-2" />
            AI Assistant
          </Button>
        </div>
      </div>

      {/* Left Panel Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowFilters(!showFilters)}
        className={cn(
          "absolute top-20 z-20 tech-card border-0 backdrop-blur-xl bg-white/10 dark:bg-black/20 rounded-xl hover:bg-white/20 pointer-events-auto",
          showFilters ? "left-[340px]" : "left-4"
        )}
      >
        {showFilters ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </Button>

      {/* Left Panel - Sliding Glassmorphism Panel */}
      <div className={cn(
        "absolute top-16 bottom-4 left-0 z-10 transition-all duration-300 pointer-events-auto",
        showFilters ? "translate-x-0" : "-translate-x-full",
        "w-80"
      )}>
        <div className="h-full flex flex-col tech-card border-0 !transition-none backdrop-blur-3xl bg-white/10 dark:bg-black/20 rounded-r-3xl overflow-hidden ml-4">
          {/* Header */}
          <div className="p-4 border-b border-white/30 dark:border-white/20 backdrop-blur">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Workspaces
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Find and book professional workspaces
            </p>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-white/30 dark:border-white/20 backdrop-blur">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search workspaces..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 bg-white/10 dark:bg-black/20 backdrop-blur-xl border-white/30 dark:border-white/20 focus:bg-white/20 dark:focus:bg-black/30 rounded-2xl"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-white/30 dark:border-white/20 backdrop-blur flex-shrink-0">
            <HubsSearchFilters
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>
          
          {/* Results List */}
          <div className="flex-1 flex flex-col overflow-hidden backdrop-blur">
            <div className="p-4 pb-2 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Results</h3>
              <Badge variant="outline" className="text-xs bg-primary/20 border-primary/50 text-primary">
                {workspaces?.length || 0} spaces
              </Badge>
            </div>
            
            <ScrollArea className="flex-1 overflow-hidden">
              <div className="p-4 pt-2 space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : workspaces && workspaces.length > 0 ? (
                  workspaces.map((workspace) => (
                    <HubsWorkspaceCard
                      key={workspace.id}
                      workspace={workspace}
                      isSelected={selectedWorkspace?.id === workspace.id}
                      onSelect={() => handleWorkspaceSelect(workspace)}
                      onBook={() => handleBookWorkspace(workspace)}
                      compact
                    />
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No workspaces found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Right Detail Panel - Slides in when workspace selected */}
      <HubsDetailPanel
        workspace={selectedWorkspace}
        onClose={() => setSelectedWorkspace(null)}
        onBook={handleBookWorkspace}
      />

      {/* AI Assistant Panel - Right Side */}
      {showAIAssistant && (
        <div className={cn(
          "absolute top-16 bottom-4 right-4 z-10 transition-all duration-300 pointer-events-auto",
          selectedWorkspace ? "right-[360px]" : "right-4",
          "w-80"
        )}>
          <div className="h-full tech-card border-0 !transition-none backdrop-blur-3xl bg-white/10 dark:bg-black/20 rounded-3xl overflow-hidden">
            <HubsAIAssistant
              onClose={() => setShowAIAssistant(false)}
              onSearch={handleAISearch}
              workspaces={workspaces || []}
            />
          </div>
        </div>
      )}

      {/* Workspaces Count Badge - Bottom Right */}
      <div className="absolute bottom-4 right-4 z-10 pointer-events-auto">
        <Badge 
          variant="outline" 
          className="tech-card border-0 backdrop-blur-xl bg-white/10 dark:bg-black/20 px-3 py-1.5 text-sm"
        >
          <Building2 className="w-4 h-4 mr-2" />
          {workspaces?.length || 0} workspaces
        </Badge>
      </div>

      {/* Booking Modal */}
      <HubsBookingModal
        workspace={selectedWorkspace}
        open={showBookingModal}
        onOpenChange={setShowBookingModal}
      />
    </div>
  );
};

export default Hubs;
