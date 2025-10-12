import { useState } from 'react';
import UnifiedCalendar from '@/components/UnifiedCalendar';
import DashboardNavigation from '@/components/DashboardNavigation';
import { CreateEventDialog } from '@/components/CreateEventDialog';
import { EventDetailsDialog } from '@/components/EventDetailsDialog';

export default function Events() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const handleItemClick = (item: any) => {
    if (item.type === 'event') {
      // Fetch full event details
      setSelectedEvent(item);
      setShowEventDetails(true);
    }
  };

  const handleEventUpdated = () => {
    // Refresh will be handled by UnifiedCalendar's real-time subscription
    setShowEventDetails(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavigation />
      <div className="container mx-auto px-4 py-8 pt-24">
        <UnifiedCalendar 
          showCreateButton={true}
          onCreateEvent={() => setShowCreateDialog(true)}
          onItemClick={handleItemClick}
          filterTypes={['event', 'session', 'availability']}
        />
      </div>

      <CreateEventDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onEventCreated={() => {
          setShowCreateDialog(false);
          // Refresh will be handled by UnifiedCalendar's real-time subscription
        }}
      />

      {selectedEvent && (
        <EventDetailsDialog
          open={showEventDetails}
          onOpenChange={setShowEventDetails}
          event={selectedEvent}
          onEventUpdated={handleEventUpdated}
        />
      )}
    </div>
  );
}