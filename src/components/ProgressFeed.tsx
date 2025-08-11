import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageSquare, 
  Heart, 
  Share, 
  TrendingUp, 
  Award, 
  Users, 
  DollarSign,
  Camera,
  Plus
} from "lucide-react";

const ProgressFeed = () => {
  const feedItems = [
    {
      id: 1,
      user: {
        name: "You",
        avatar: "/placeholder.svg",
        company: "FinPay Solutions"
      },
      type: "milestone",
      content: "🎉 Just completed our MVP testing phase! 47 users provided valuable feedback and we're seeing 85% positive response rate. Ready for the next phase of development.",
      timestamp: "2 hours ago",
      metrics: {
        likes: 12,
        comments: 3,
        shares: 2
      },
      tags: ["MVP", "Testing", "FinTech"]
    },
    {
      id: 2,
      user: {
        name: "TechFlow AI",
        avatar: "/placeholder.svg",
        company: "TechFlow AI"
      },
      type: "funding",
      content: "Exciting news! We've just closed our $2M seed round led by Accel Partners. Time to accelerate our AI platform development and expand the team. Looking for talented engineers!",
      timestamp: "4 hours ago",
      metrics: {
        likes: 45,
        comments: 12,
        shares: 8
      },
      tags: ["Funding", "Seed Round", "AI", "Hiring"]
    },
    {
      id: 3,
      user: {
        name: "GreenTech Innovations",
        avatar: "/placeholder.svg",
        company: "GreenTech Innovations"
      },
      type: "partnership",
      content: "Partnership announcement: We're collaborating with Tesla on sustainable energy solutions for urban environments. This opens up incredible opportunities for scaling our impact.",
      timestamp: "1 day ago",
      metrics: {
        likes: 78,
        comments: 23,
        shares: 15
      },
      tags: ["Partnership", "Tesla", "Sustainability"]
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "milestone": return <TrendingUp className="w-4 h-4 text-ocean-primary" />;
      case "funding": return <DollarSign className="w-4 h-4 text-green-500" />;
      case "partnership": return <Users className="w-4 h-4 text-accent" />;
      default: return <Award className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "milestone": return "Milestone Achieved";
      case "funding": return "Funding Update";
      case "partnership": return "Partnership";
      default: return "Update";
    }
  };

  return (
    <Card className="glass-morphism">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Community Feed</CardTitle>
          <Button variant="hero" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Share Update
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Share Update Box */}
        <div className="p-4 border border-ocean-border rounded-lg">
          <div className="flex space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/placeholder.svg" alt="You" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea 
                placeholder="Share your startup progress, milestones, or insights..."
                className="border-0 resize-none focus:ring-0 p-0 min-h-[60px]"
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm">
                    <Camera className="w-4 h-4 mr-1" />
                    Photo
                  </Button>
                  <Button variant="ghost" size="sm">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Milestone
                  </Button>
                </div>
                <Button variant="hero" size="sm">
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Feed Items */}
        {feedItems.map((item) => (
          <div key={item.id} className="p-4 border border-ocean-border rounded-lg hover:bg-ocean-surface/5 transition-colors">
            <div className="flex space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={item.user.avatar} alt={item.user.name} />
                <AvatarFallback>{item.user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="font-medium text-sm">{item.user.name}</h4>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{item.user.company}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                </div>
                
                <div className="flex items-center space-x-2 mb-3">
                  {getTypeIcon(item.type)}
                  <Badge variant="outline" className="text-xs">
                    {getTypeLabel(item.type)}
                  </Badge>
                </div>
                
                <p className="text-sm mb-3 leading-relaxed">{item.content}</p>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex items-center space-x-4 text-muted-foreground">
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    <Heart className="w-4 h-4 mr-1" />
                    <span className="text-xs">{item.metrics.likes}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    <span className="text-xs">{item.metrics.comments}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    <Share className="w-4 h-4 mr-1" />
                    <span className="text-xs">{item.metrics.shares}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <Button variant="outline" className="w-full">
          Load More Updates
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProgressFeed;