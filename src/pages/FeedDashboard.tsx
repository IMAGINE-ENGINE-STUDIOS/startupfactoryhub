import DashboardNavigation from '@/components/DashboardNavigation';
import UnifiedCommunityFeed from '@/components/UnifiedCommunityFeed';

export default function FeedDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNavigation />
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Startup Feed</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Connect, share, and grow together
          </p>
        </div>
        <UnifiedCommunityFeed showCreatePost={true} />
      </div>
    </div>
  );
}
