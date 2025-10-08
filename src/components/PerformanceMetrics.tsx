import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Target,
  TrendingUp,
  Award,
  Zap,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface Metric {
  label: string;
  value: number;
  target: number;
  unit: string;
  status: 'excellent' | 'good' | 'needs-improvement';
}

export default function PerformanceMetrics() {
  const metrics: Metric[] = [
    {
      label: 'Response Rate',
      value: 85,
      target: 90,
      unit: '%',
      status: 'good',
    },
    {
      label: 'Completion Rate',
      value: 92,
      target: 80,
      unit: '%',
      status: 'excellent',
    },
    {
      label: 'Avg. Response Time',
      value: 2.5,
      target: 4,
      unit: 'hrs',
      status: 'excellent',
    },
    {
      label: 'Success Stories',
      value: 28,
      target: 30,
      unit: '',
      status: 'good',
    },
    {
      label: 'Active Engagement',
      value: 68,
      target: 75,
      unit: '%',
      status: 'needs-improvement',
    },
    {
      label: 'Goal Achievement',
      value: 78,
      target: 85,
      unit: '%',
      status: 'good',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-500';
      case 'good':
        return 'text-blue-500';
      case 'needs-improvement':
        return 'text-orange-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'excellent':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Excellent</Badge>;
      case 'good':
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Good</Badge>;
      case 'needs-improvement':
        return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">Needs Improvement</Badge>;
      default:
        return null;
    }
  };

  const achievements = [
    {
      title: 'Quick Responder',
      description: 'Responded to 50+ messages within 2 hours',
      icon: Zap,
      unlocked: true,
    },
    {
      title: 'Super Connector',
      description: 'Made 100+ meaningful connections',
      icon: Target,
      unlocked: true,
    },
    {
      title: 'Impact Maker',
      description: 'Helped 20+ startups succeed',
      icon: Award,
      unlocked: false,
    },
    {
      title: 'Consistency King',
      description: 'Active for 90 consecutive days',
      icon: CheckCircle2,
      unlocked: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Metrics
          </h3>
          <Badge variant="outline">Last 30 days</Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {metrics.map((metric) => (
            <div key={metric.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{metric.label}</span>
                {getStatusBadge(metric.status)}
              </div>
              <div className="flex items-end justify-between">
                <span className={`text-3xl font-bold ${getStatusColor(metric.status)}`}>
                  {metric.value}{metric.unit}
                </span>
                <span className="text-sm text-muted-foreground">
                  Target: {metric.target}{metric.unit}
                </span>
              </div>
              <Progress
                value={(metric.value / metric.target) * 100}
                className="h-2"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Achievements */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Award className="h-5 w-5" />
          <h3 className="font-semibold">Achievements</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {achievements.map((achievement) => (
            <Card
              key={achievement.title}
              className={`p-4 ${
                achievement.unlocked
                  ? 'border-primary/50 bg-primary/5'
                  : 'opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    achievement.unlocked
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <achievement.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{achievement.title}</h4>
                    {achievement.unlocked && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {achievement.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Session</p>
              <p className="text-xl font-bold">24 min</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tasks Completed</p>
              <p className="text-xl font-bold">142</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Target className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Goals Met</p>
              <p className="text-xl font-bold">15/20</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
