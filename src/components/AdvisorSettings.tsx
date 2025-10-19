import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Calendar, User } from 'lucide-react';
import AvailabilityManager from './AvailabilityManager';

interface AdvisorSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdvisorSettings({ open, onOpenChange }: AdvisorSettingsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Advisor Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="availability" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="availability" className="gap-2">
              <Calendar className="h-4 w-4" />
              Availability
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="availability" className="space-y-4">
            <AvailabilityManager />
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <div className="p-6 text-center text-muted-foreground">
              <p>Profile settings coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}