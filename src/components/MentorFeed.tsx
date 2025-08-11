import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageSquare, 
  Heart, 
  Share, 
  Users, 
  Award, 
  Lightbulb,
  Camera,
  Plus,
  TrendingUp
} from "lucide-react";

const MentorFeed = () => {
  const feedItems = [
    {
      id: 1,
      user: {
        name: "You",
        avatar: "/placeholder.svg",
        title: "Ex-Google PM, Startup Advisor"
      },
      type: "advice",
      content: "💡 Key insight for early-stage founders: Don't build features your users haven't asked for. I've seen too many startups get caught in the 'feature trap' - building what they think users want instead of what they actually need. Always validate with real user feedback first.",
      timestamp: "3 hours ago",
      metrics: {
        likes: 89,
        comments: 23,
        shares: 12
      },
      tags: ["#startup advice", "#product management", "#validation"]
    },
    {
      id: 2,
      user: {
        name: "Marcus Rodriguez",
        avatar: "/placeholder.svg",
        title: "Serial Entrepreneur & Mentor"
      },
      type: "success",
      content: "🎉 Incredibly proud to announce that my mentee Emma Wilson from GreenTech just closed their $1.5M seed round! Watching her journey from idea to funded startup has been amazing. The key was focusing on proving unit economics before scaling. Congrats Emma! 🚀",
      timestamp: "1 day ago",
      metrics: {
        likes: 156,
        comments: 34,
        shares: 28
      },
      tags: ["#mentorship", "#funding success", "#proud mentor"]
    },
    {
      id: 3,
      user: {
        name: "Lisa Chen",
        avatar: "/placeholder.svg",
        title: "VP Engineering, Startup Advisor"
      },
      type: "workshop",
      content: "📚 Excited to be hosting a technical leadership workshop next Friday! Topics include: scaling engineering teams, technical debt management, and building robust CI/CD pipelines. Perfect for CTOs and tech leads at Series A startups. Link in comments!",
      timestamp: "2 days ago",
      metrics: {
        likes: 67,
        comments: 18,
        shares: 15
      },
      tags: ["#workshop", "#technical leadership", "#engineering"]
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "advice": return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      case "success": return <Award className="w-4 h-4 text-green-500" />;
      case "workshop": return <Users className="w-4 h-4 text-ocean-primary" />;
      default: return <TrendingUp className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "advice": return "Mentor Advice";
      case "success": return "Success Story";
      case "workshop": return "Workshop";
      default: return "Update";
    }
  };

  return (
    <Card className="glass-morphism">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Mentor Community</CardTitle>
          <Button variant="hero" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Share Insight
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Share Insight Box */}
        <div className="p-4 border border-ocean-border rounded-lg">
          <div className="flex space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/placeholder.svg" alt="You" />
              <AvatarFallback>SC</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea 
                placeholder="Share insights, advice, or celebrate your mentees' successes..."
                className="border-0 resize-none focus:ring-0 p-0 min-h-[60px]"
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm">
                    <Camera className="w-4 h-4 mr-1" />
                    Photo
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Lightbulb className="w-4 h-4 mr-1" />
                    Advice
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Award className="w-4 h-4 mr-1" />
                    Success
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
                  <span className="text-xs text-muted-foreground">{item.user.title}</span>
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
                    <span key={tag} className="text-xs text-ocean-primary hover:underline cursor-pointer">
                      {tag}
                    </span>
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
          Load More Posts
        </Button>
      </CardContent>
    </Card>
  );
};

export default MentorFeed;