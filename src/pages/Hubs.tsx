import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { HubsMapView } from '@/components/hubs/HubsMapView';
import { HubsSearchFilters } from '@/components/hubs/HubsSearchFilters';
import { HubsWorkspaceCard } from '@/components/hubs/HubsWorkspaceCard';
import { HubsBookingModal } from '@/components/hubs/HubsBookingModal';
import { HubsAIAssistant } from '@/components/hubs/HubsAIAssistant';
import { useHubsSearch, WorkspaceFilters, Workspace } from '@/hooks/useHubsSearch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Map, List, Bot, X, Building2, ArrowLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const Hubs = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [showFilters, setShowFilters] = useState(!isMobile);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  
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

  const handleWorkspaceSelect = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
  };

  const handleBookWorkspace = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setShowBookingModal(true);
  };

  const handleAISearch = (searchFilters: Partial<WorkspaceFilters>) => {
    setFilters(prev => ({ ...prev, ...searchFilters }));
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
    <div className="relative h-screen w-full overflow-hidden bg-background">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                Startup Hubs
              </h1>
            </div>
            {workspaces && (
              <Badge variant="secondary" className="ml-2">
                {workspaces.length} spaces
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <Button
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('map')}
                className="h-8 px-3"
              >
                <Map className="h-4 w-4 mr-1" />
                Map
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
              >
                <List className="h-4 w-4 mr-1" />
                List
              </Button>
            </div>
            
            {/* AI Assistant Toggle */}
            <Button
              variant={showAIAssistant ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowAIAssistant(!showAIAssistant)}
              className="gap-2"
            >
              <Bot className="h-4 w-4" />
              {!isMobile && 'AI Assistant'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="absolute inset-0 pt-16 flex">
        {/* Left Panel - Filters & Results */}
        <div
          className={cn(
            "h-full bg-background/95 backdrop-blur-xl border-r border-border/50 transition-all duration-300 z-10",
            showFilters ? (isMobile ? "w-full absolute inset-0 pt-0" : "w-80") : "w-0 overflow-hidden"
          )}
        >
          {showFilters && (
            <div className="h-full flex flex-col">
              {isMobile && (
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                  <h2 className="font-semibold">Filters & Results</h2>
                  <Button variant="ghost" size="icon" onClick={() => setShowFilters(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              )}
              
              {/* Filters */}
              <div className="p-4 border-b border-border/50">
                <HubsSearchFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </div>
              
              {/* Results List */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
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
          )}
        </div>

        {/* Toggle Filters Button (when collapsed) */}
        {!showFilters && !isMobile && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(true)}
            className="absolute left-4 top-20 z-10"
          >
            Show Filters
          </Button>
        )}

        {/* Map / List View */}
        <div className="flex-1 relative">
          {viewMode === 'map' ? (
            <HubsMapView
              workspaces={workspaces || []}
              selectedWorkspace={selectedWorkspace}
              onWorkspaceSelect={handleWorkspaceSelect}
              onWorkspaceBook={handleBookWorkspace}
            />
          ) : (
            <ScrollArea className="h-full">
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                  <div className="col-span-full flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : workspaces && workspaces.length > 0 ? (
                  workspaces.map((workspace) => (
                    <HubsWorkspaceCard
                      key={workspace.id}
                      workspace={workspace}
                      isSelected={selectedWorkspace?.id === workspace.id}
                      onSelect={() => handleWorkspaceSelect(workspace)}
                      onBook={() => handleBookWorkspace(workspace)}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <Building2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No workspaces found</p>
                    <p className="text-sm">Try adjusting your filters or search in a different location</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* AI Assistant Panel */}
        {showAIAssistant && (
          <div
            className={cn(
              "h-full bg-background/95 backdrop-blur-xl border-l border-border/50 transition-all duration-300",
              isMobile ? "w-full absolute inset-0 pt-0 z-20" : "w-96"
            )}
          >
            <HubsAIAssistant
              onClose={() => setShowAIAssistant(false)}
              onSearch={handleAISearch}
              workspaces={workspaces || []}
            />
          </div>
        )}
      </div>

      {/* Mobile Filter Toggle */}
      {isMobile && !showFilters && viewMode === 'map' && (
        <Button
          variant="default"
          size="sm"
          onClick={() => setShowFilters(true)}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 shadow-lg"
        >
          Show Filters & Results
        </Button>
      )}

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
