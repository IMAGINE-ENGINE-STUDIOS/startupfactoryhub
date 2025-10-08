import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  MessageSquare,
  Users,
  Video,
  Compass,
  BarChart3,
  Plus,
  FileText,
} from 'lucide-react';

export default function QuickActionsMenu() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Calendar,
      label: 'Schedule Meeting',
      description: 'Book a mentoring session',
      onClick: () => navigate('/mentoring-sessions'),
      color: 'bg-blue-500/10 text-blue-500',
    },
    {
      icon: MessageSquare,
      label: 'Send Message',
      description: 'Connect with someone',
      onClick: () => navigate('/messages'),
      color: 'bg-purple-500/10 text-purple-500',
    },
    {
      icon: Users,
      label: 'Find Matches',
      description: 'Discover connections',
      onClick: () => navigate('/explore'),
      color: 'bg-green-500/10 text-green-500',
    },
    {
      icon: Video,
      label: 'Join Call',
      description: 'Start video session',
      onClick: () => navigate('/mentoring-sessions'),
      color: 'bg-red-500/10 text-red-500',
    },
    {
      icon: Compass,
      label: 'Explore',
      description: 'Browse opportunities',
      onClick: () => navigate('/explore'),
      color: 'bg-orange-500/10 text-orange-500',
    },
    {
      icon: BarChart3,
      label: 'View Analytics',
      description: 'Check your progress',
      onClick: () => navigate('/analytics'),
      color: 'bg-cyan-500/10 text-cyan-500',
    },
    {
      icon: Plus,
      label: 'Create Post',
      description: 'Share an update',
      onClick: () => navigate('/feed'),
      color: 'bg-pink-500/10 text-pink-500',
    },
    {
      icon: FileText,
      label: 'Add Resource',
      description: 'Share knowledge',
      onClick: () => navigate('/dashboard'),
      color: 'bg-indigo-500/10 text-indigo-500',
    },
  ];

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="h-auto flex-col items-start p-4 hover:bg-accent"
            onClick={action.onClick}
          >
            <div className={`p-2 rounded-lg mb-2 ${action.color}`}>
              <action.icon className="h-5 w-5" />
            </div>
            <div className="text-left">
              <p className="font-medium text-sm">{action.label}</p>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </div>
          </Button>
        ))}
      </div>
    </Card>
  );
}
