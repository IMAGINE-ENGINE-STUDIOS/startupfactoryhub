import DashboardNavigation from "@/components/DashboardNavigation";
import UnifiedCommunityFeed from "@/components/UnifiedCommunityFeed";

const SocialFeed = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNavigation />
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Social Feed</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Share updates and connect with the community
          </p>
        </div>
        <UnifiedCommunityFeed showCreatePost={true} />
      </div>
    </div>
  );
};

export default SocialFeed;
