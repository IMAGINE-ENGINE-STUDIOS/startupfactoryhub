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
  const priorities = [
    {
      title: 'Review pending applications',
      description: `${pendingApplications} applications awaiting review`,
      priority: 'high' as const,
      icon: FileText,
      count: pendingApplications,
      show: pendingApplications > 0
    },
    {
      title: 'Check in with active startups',
      description: `${activeStartups} startups in your current cohorts`,
      priority: 'medium' as const,
      icon: Users,
      count: activeStartups,
      show: activeStartups > 0
    },
    {
      title: 'Schedule upcoming demo day',
      description: 'Plan demo day for current cohort',
      priority: 'low' as const,
      icon: Calendar,
      count: activeCohorts,
      show: activeCohorts > 0
    },
    {
      title: 'Update program details',
      description: 'Keep your accelerator profile current',
      priority: 'low' as const,
      icon: Settings,
      show: true
    }
  ];

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

  return (
    <Card className="tech-card border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-400" />
            <CardTitle className="text-lg">Accelerator Priorities</CardTitle>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              {totalSupported} startups supported
            </Badge>
          </div>
        </div>
        <CardDescription>AI-suggested actions for your program</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {priorities.filter(p => p.show).map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
          >
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <item.icon className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{item.title}</p>
              <p className="text-xs text-muted-foreground truncate">{item.description}</p>
            </div>
            <Badge className={`${getPriorityColor(item.priority)} text-xs`}>
              {item.priority}
            </Badge>
          </div>
        ))}
        
        <Button className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700" size="sm">
          <Sparkles className="h-4 w-4 mr-2" />
          Generate Portfolio Summary
        </Button>
      </CardContent>
    </Card>
  );
};

export default AcceleratorRoadmapWidget;
