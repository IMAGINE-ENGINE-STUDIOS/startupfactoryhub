import CommunityCalendar from '@/components/CommunityCalendar';
import DashboardNavigation from '@/components/DashboardNavigation';

export default function Events() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardNavigation />
      <div className="container mx-auto px-4 py-8">
        <CommunityCalendar />
      </div>
    </div>
  );
}