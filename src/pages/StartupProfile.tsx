import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import DashboardNavigation from "@/components/DashboardNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  Building, 
  MapPin, 
  Users, 
  Calendar, 
  ExternalLink,
  Heart,
  MessageSquare,
  Share,
  Camera,
  Plus,
  Target,
  TrendingUp,
  Award,
  Edit
} from "lucide-react";

const StartupProfile = () => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchCompanyData();
      fetchPosts();
    }
  }, [user]);

  const fetchCompanyData = async () => {
    if (!user) return;

    setLoading(true);
    
    // Fetch company profile
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (companyError && companyError.code !== 'PGRST116') {
      console.error('Error fetching company:', companyError);
    }

    // Fetch user profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    setCompany(companyData);
    setProfile(profileData);
    setLoading(false);
  };

  const fetchPosts = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('feed_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setPosts(data);
    }
  };

  const profileData = {
    name: company?.name || "Your Startup",
    tagline: company?.description || "Building the future",
    location: company?.location || "Not specified",
    founded: company?.founded_year?.toString() || "2024",
    teamSize: company?.team_size ? `${company.team_size} people` : "Not specified",
    stage: company?.stage || "Early Stage",
    industry: company?.industry || "Technology",
    website: company?.website || "",
    followers: 0,
    following: 0,
    posts: posts.length
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  const updates = posts.map((post) => ({
    id: post.id,
    type: post.post_type || "update",
    content: post.content,
    timestamp: formatTimestamp(post.created_at),
    media: post.media_urls || [],
    tags: [],
    metrics: { 
      likes: post.likes_count || 0, 
      comments: post.comments_count || 0, 
      shares: post.shares_count || 0 
    },
    liked: false
  }));

  const milestones = [
    { title: `Reach ${company?.funding_amount ? '$' + (company.funding_amount / 1000000) + 'M' : '$1M'} funding`, date: "Q1 2024", completed: company?.funding_amount ? true : false },
    { title: "Launch MVP", date: "Q2 2024", completed: company?.stage === 'mvp' || company?.stage === 'growth' },
    { title: "First 100 customers", date: "Q3 2024", completed: false },
    { title: "Team expansion", date: "Q4 2024", completed: (company?.team_size || 0) > 10 }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "milestone": return <Target className="w-4 h-4 text-ocean-primary" />;
      case "team": return <Users className="w-4 h-4 text-accent" />;
      case "funding": return <TrendingUp className="w-4 h-4 text-green-500" />;
      default: return <Award className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNavigation />
        <div className="container mx-auto px-6 py-12 text-center">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNavigation />
        <div className="container mx-auto px-6 py-12 text-center">
          <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Company Profile</h2>
          <p className="text-muted-foreground mb-6">Create your company profile to get started</p>
          <Button onClick={() => window.location.href = '/dashboard'}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavigation />
      
      {/* Profile Header */}
      <div className="relative">
        <div 
          className="h-64 bg-gradient-hero relative overflow-hidden"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpolygon points='30,0 60,30 30,60 0,30'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-ocean-primary/20 to-accent/20" />
        </div>
        
        <div className="container mx-auto px-6">
          <div className="relative -mt-24">
            <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6">
              <Avatar className="w-32 h-32 border-4 border-background shadow-xl">
                <AvatarImage src="/placeholder.svg" alt={profileData.name} />
                <AvatarFallback className="text-3xl font-bold">FP</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="bg-background rounded-xl p-6 shadow-xl border border-ocean-border">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-foreground">{profileData.name}</h1>
                      <p className="text-muted-foreground mt-1">{profileData.tagline}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {profileData.location}
                        </div>
                        <div className="flex items-center">
                          <Building className="w-4 h-4 mr-1" />
                          Founded {profileData.founded}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {profileData.teamSize}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 mt-4 md:mt-0">
                      <Button variant="outline" size="sm">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                      <Button 
                        variant={isFollowing ? "outline" : "hero"} 
                        size="sm"
                        onClick={() => setIsFollowing(!isFollowing)}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <Badge variant="secondary">{profileData.stage}</Badge>
                    <Badge variant="outline">{profileData.industry}</Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      <a href={`https://${profileData.website}`} className="hover:text-ocean-primary">
                        {profileData.website}
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-8 mt-4 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-foreground">{profileData.followers.toLocaleString()}</div>
                      <div className="text-muted-foreground">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-foreground">{profileData.following}</div>
                      <div className="text-muted-foreground">Following</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-foreground">{profileData.posts}</div>
                      <div className="text-muted-foreground">Posts</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Activity Feed */}
              <div className="lg:col-span-2 space-y-6">
                {/* Share Update */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/placeholder.svg" alt="You" />
                        <AvatarFallback>FP</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Textarea 
                          placeholder="Share your latest progress, milestone, or insights..."
                          className="border-0 resize-none focus:ring-0 p-0 min-h-[80px]"
                        />
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              <Camera className="w-4 h-4 mr-1" />
                              Photo
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Target className="w-4 h-4 mr-1" />
                              Milestone
                            </Button>
                          </div>
                          <Button variant="hero" size="sm">
                            <Plus className="w-4 h-4 mr-1" />
                            Share Update
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Updates Feed */}
                {updates.map((update) => (
                  <Card key={update.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="/placeholder.svg" alt={profileData.name} />
                          <AvatarFallback>FP</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium">{profileData.name}</h4>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">{update.timestamp}</span>
                            <div className="flex items-center space-x-1">
                              {getTypeIcon(update.type)}
                            </div>
                          </div>
                          
                          <p className="text-sm mb-3 leading-relaxed">{update.content}</p>
                          
                          {update.media.length > 0 && (
                            <div className="mb-3">
                              <img 
                                src={update.media[0]} 
                                alt="Update media" 
                                className="rounded-lg w-full max-w-md h-48 object-cover"
                              />
                            </div>
                          )}
                          
                          <div className="flex flex-wrap gap-1 mb-3">
                            {update.tags.map((tag) => (
                              <span key={tag} className="text-xs text-ocean-primary hover:underline cursor-pointer">
                                {tag}
                              </span>
                            ))}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-muted-foreground">
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                              <Heart className={`w-4 h-4 mr-1 ${update.liked ? 'fill-red-500 text-red-500' : ''}`} />
                              <span className="text-xs">{update.metrics.likes}</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                              <MessageSquare className="w-4 h-4 mr-1" />
                              <span className="text-xs">{update.metrics.comments}</span>
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 px-2">
                              <Share className="w-4 h-4 mr-1" />
                              <span className="text-xs">{update.metrics.shares}</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Milestones */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recent Milestones</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {milestones.map((milestone, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          milestone.completed ? 'bg-green-500' : 'bg-muted'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{milestone.title}</p>
                          <p className="text-xs text-muted-foreground">{milestone.date}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Profile Views</span>
                      <span className="text-sm font-medium">2,431</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Mentor Connections</span>
                      <span className="text-sm font-medium">12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Investor Interest</span>
                      <span className="text-sm font-medium">8</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Roadmap Progress</span>
                      <span className="text-sm font-medium">67%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="about">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">About FinPay Solutions</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  FinPay Solutions is revolutionizing the financial services industry through our AI-powered payment platform. 
                  We're building the next generation of payment infrastructure that makes financial services more accessible, 
                  transparent, and efficient for businesses and consumers worldwide.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Company Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Industry</span>
                        <span>FinTech</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Stage</span>
                        <span>Seed</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Founded</span>
                        <span>2023</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Team Size</span>
                        <span>8 people</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Focus Areas</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">AI/ML</Badge>
                      <Badge variant="secondary">Payments</Badge>
                      <Badge variant="secondary">API Infrastructure</Badge>
                      <Badge variant="secondary">B2B SaaS</Badge>
                      <Badge variant="secondary">Financial Services</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roadmap">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Startup Roadmap</h3>
                <p className="text-muted-foreground mb-6">AI-generated roadmap based on your stage and industry</p>
                {/* Roadmap content would go here */}
                <div className="text-center py-8 text-muted-foreground">
                  Detailed roadmap view coming soon...
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Team Members</h3>
                {/* Team content would go here */}
                <div className="text-center py-8 text-muted-foreground">
                  Team member profiles coming soon...
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Media & Resources</h3>
                {/* Media content would go here */}
                <div className="text-center py-8 text-muted-foreground">
                  Media gallery coming soon...
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StartupProfile;