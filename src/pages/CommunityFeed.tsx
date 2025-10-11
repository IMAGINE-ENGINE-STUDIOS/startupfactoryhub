import DashboardNavigation from "@/components/DashboardNavigation";
import UnifiedCommunityFeed from "@/components/UnifiedCommunityFeed";

const CommunityFeed = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNavigation />
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Community Feed</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Connect, share, and learn from the startup community
          </p>
        </div>
        <UnifiedCommunityFeed showCreatePost={true} />
      </div>
    </div>
  );
};

export default CommunityFeed;
