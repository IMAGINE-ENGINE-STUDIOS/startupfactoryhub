import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Sparkles, Users, FileText, Calendar, Settings } from 'lucide-react';
interface AcceleratorRoadmapWidgetProps {
  activeCohorts: number;
  pendingApplications: number;
  activeStartups: number;
  totalSupported: number;
}
const AcceleratorRoadmapWidget = ({
  activeCohorts,
  pendingApplications,
  activeStartups,
  totalSupported
}: AcceleratorRoadmapWidgetProps) => {
  const priorities = [{
    title: 'Review pending applications',
    description: `${pendingApplications} applications awaiting review`,
    priority: 'high' as const,
    icon: FileText,
    count: pendingApplications,
    show: pendingApplications > 0
  }, {
    title: 'Check in with active startups',
    description: `${activeStartups} startups in your current cohorts`,
    priority: 'medium' as const,
    icon: Users,
    count: activeStartups,
    show: activeStartups > 0
  }, {
    title: 'Schedule upcoming demo day',
    description: 'Plan demo day for current cohort',
    priority: 'low' as const,
    icon: Calendar,
    count: activeCohorts,
    show: activeCohorts > 0
  }, {
    title: 'Update program details',
    description: 'Keep your accelerator profile current',
    priority: 'low' as const,
    icon: Settings,
    show: true
  }];
  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    }
  };
  return <Card className="tech-card border-0">
      
      
    </Card>;
};
export default AcceleratorRoadmapWidget;