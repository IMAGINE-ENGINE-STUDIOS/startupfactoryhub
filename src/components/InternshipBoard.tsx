import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, Plus, MapPin, Clock, DollarSign, Users, Building, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { InternshipApplicationsViewer } from './InternshipApplicationsViewer';

interface Internship {
  id: string;
  title: string;
  description: string;
  company_name: string;
  location: string;
  duration: string;
  compensation: string;
  requirements: string[];
  company_id: string;
  created_at: string;
  applications_count?: number;
}

export default function InternshipBoard() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [newInternship, setNewInternship] = useState({
    title: '',
    description: '',
    location: '',
    duration: '',
    compensation: '',
    requirements: '',
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserRole();
      fetchInternships();
    }
  }, [user]);

  const fetchUserRole = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    if (data) setUserRole(data.role);
  };

  const fetchInternships = async () => {
    const { data, error } = await supabase
      .from('internships')
      .select(`
        *,
        companies:company_id (
          name,
          location
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const formattedInternships: Internship[] = data.map((internship: any) => ({
        id: internship.id,
        title: internship.title,
        description: internship.description,
        company_name: internship.companies?.name || 'Unknown Company',
        location: internship.location || internship.companies?.location || 'Remote',
        duration: internship.duration,
        compensation: internship.compensation,
        requirements: internship.requirements || [],
        company_id: internship.company_id,
        created_at: internship.created_at,
        applications_count: internship.applications_count || 0,
      }));

      setInternships(formattedInternships);
    }
  };

  const getInternshipTitle = (industry: string) => {
    const titles = {
      'fintech': 'Fintech Product Intern',
      'healthtech': 'Healthcare Technology Intern',
      'edtech': 'Educational Technology Intern',
      'ai': 'AI/ML Research Intern',
      'saas': 'Software Development Intern',
      'default': 'Product Development Intern'
    };
    return titles[industry as keyof typeof titles] || titles.default;
  };

  const getInternshipRequirements = (industry: string) => {
    const requirements = {
      'fintech': ['Finance or CS background', 'Interest in financial technology', 'Basic programming skills'],
      'healthtech': ['Pre-med or health sciences', 'Interest in healthcare innovation', 'Research experience preferred'],
      'edtech': ['Education or technology background', 'Passion for learning', 'Communication skills'],
      'ai': ['Computer Science or related field', 'Python/ML experience', 'Strong analytical skills'],
      'saas': ['Computer Science background', 'Web development skills', 'Agile methodology familiarity'],
      'default': ['Relevant academic background', 'Strong work ethic', 'Team collaboration skills']
    };
    return requirements[industry as keyof typeof requirements] || requirements.default;
  };

  const createInternship = async () => {
    if (!user) return;

    // Get user's company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (companyError || !company) {
      toast({
        title: "Error",
        description: "Please create a company profile first",
        variant: "destructive",
      });
      return;
    }

    const internshipData = {
      company_id: company.id,
      title: newInternship.title,
      description: newInternship.description,
      location: newInternship.location,
      duration: newInternship.duration,
      compensation: newInternship.compensation,
      requirements: newInternship.requirements.split(',').map(r => r.trim()).filter(r => r),
      status: 'active'
    };

    const { error } = await supabase
      .from('internships')
      .insert(internshipData);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to post internship opportunity",
        variant: "destructive",
      });
      return;
    }

    // Also create a feed post about it
    await supabase.from('feed_posts').insert({
      content: `🚀 New Internship Opportunity: ${newInternship.title}\n\n${newInternship.description}\n\n#internship #opportunity #hiring`,
      user_id: user.id,
      post_type: 'internship' as 'internship',
      internship_data: internshipData
    });

    toast({
      title: "Success!",
      description: "Internship opportunity posted successfully",
    });

    setShowCreateForm(false);
    setNewInternship({
      title: '',
      description: '',
      location: '',
      duration: '',
      compensation: '',
      requirements: '',
    });
    
    fetchInternships();
  };

  const applyToInternship = async (internshipId: string, companyName: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('internship_applications')
      .insert({
        internship_id: internshipId,
        user_id: user.id,
        status: 'pending'
      });

    if (error) {
      if (error.code === '23505') {
        toast({
          title: "Already Applied",
          description: "You've already applied to this internship.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to submit application. Please try again.",
          variant: "destructive",
        });
      }
      return;
    }

    toast({
      title: "Application Submitted!",
      description: `Your application to ${companyName} has been submitted successfully.`,
    });
    
    fetchInternships();
  };

  const canCreateInternships = userRole === 'startup';
  const canApplyToInternships = userRole === 'student';

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span>Internship Opportunities</span>
            </div>
            {canCreateInternships && (
              <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
                <DialogTrigger asChild>
                  <Button className="pulse-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Post Internship
                  </Button>
                </DialogTrigger>
                <DialogContent className="tech-card border-0 !transition-none max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Post Internship Opportunity</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">Position Title</label>
                      <Input
                        value={newInternship.title}
                        onChange={(e) => setNewInternship({...newInternship, title: e.target.value})}
                        placeholder="e.g., Software Development Intern"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground">Description</label>
                      <Textarea
                        value={newInternship.description}
                        onChange={(e) => setNewInternship({...newInternship, description: e.target.value})}
                        placeholder="Describe the internship role, responsibilities, and what the intern will learn..."
                        className="mt-1 min-h-[100px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground">Location</label>
                        <Input
                          value={newInternship.location}
                          onChange={(e) => setNewInternship({...newInternship, location: e.target.value})}
                          placeholder="e.g., San Francisco, CA or Remote"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground">Duration</label>
                        <Select value={newInternship.duration} onValueChange={(value) => setNewInternship({...newInternship, duration: value})}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3 months">3 months</SelectItem>
                            <SelectItem value="6 months">6 months</SelectItem>
                            <SelectItem value="12 months">12 months</SelectItem>
                            <SelectItem value="flexible">Flexible</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground">Compensation</label>
                      <Select value={newInternship.compensation} onValueChange={(value) => setNewInternship({...newInternship, compensation: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select compensation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Unpaid">Unpaid</SelectItem>
                          <SelectItem value="$500/month">$500/month</SelectItem>
                          <SelectItem value="$1,000/month">$1,000/month</SelectItem>
                          <SelectItem value="$2,000/month">$2,000/month</SelectItem>
                          <SelectItem value="$3,000/month">$3,000/month</SelectItem>
                          <SelectItem value="negotiable">Negotiable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground">Requirements</label>
                      <Textarea
                        value={newInternship.requirements}
                        onChange={(e) => setNewInternship({...newInternship, requirements: e.target.value})}
                        placeholder="List the requirements separated by commas (e.g., Computer Science background, Python experience, Strong communication skills)"
                        className="mt-1"
                      />
                    </div>

                    <div className="flex space-x-3">
                      <Button onClick={createInternship} className="pulse-primary">
                        Post Internship
                      </Button>
                      <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {canCreateInternships && 'Post internship opportunities to attract talented students to your startup.'}
            {canApplyToInternships && 'Discover exciting internship opportunities at innovative startups.'}
            {!canCreateInternships && !canApplyToInternships && 'Browse internship opportunities posted by startups in our ecosystem.'}
          </p>
        </CardContent>
      </Card>

      {canCreateInternships ? (
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse">Browse Internships</TabsTrigger>
            <TabsTrigger value="applications">Manage Applications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="browse" className="space-y-4">
            {/* Internship Listings */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {internships.map((internship) => (
          <Card key={internship.id} className="tech-card border-0 hover:scale-[1.02] transition-transform">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                    {internship.company_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground line-clamp-2">{internship.title}</h3>
                  <p className="text-sm text-muted-foreground">{internship.company_name}</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{internship.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2 text-primary" />
                  {internship.location}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-2 text-primary" />
                  {internship.duration}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4 mr-2 text-primary" />
                  {internship.compensation}
                </div>
                {internship.applications_count !== undefined && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="h-4 w-4 mr-2 text-primary" />
                    {internship.applications_count} applications
                  </div>
                )}
              </div>

              <div className="mb-4">
                <p className="text-xs font-medium text-foreground mb-2">Requirements:</p>
                <div className="flex flex-wrap gap-1">
                  {internship.requirements.slice(0, 3).map((req, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {req}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                {canApplyToInternships && (
                  <Button 
                    size="sm" 
                    onClick={() => applyToInternship(internship.id, internship.company_name)}
                    className="flex-1 pulse-primary"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Apply
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
            </div>

            {internships.length === 0 && (
              <Card className="tech-card border-0 text-center p-12">
                <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No internships available yet</h3>
                <p className="text-muted-foreground">
                  Be the first to post an internship opportunity!
                </p>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="applications">
            <InternshipApplicationsViewer />
          </TabsContent>
        </Tabs>
      ) : (
        <>
          {/* Internship Listings for non-company users */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {internships.map((internship) => (
              <Card key={internship.id} className="tech-card border-0 hover:scale-[1.02] transition-transform">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                        {internship.company_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground line-clamp-2">{internship.title}</h3>
                      <p className="text-sm text-muted-foreground">{internship.company_name}</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{internship.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2 text-primary" />
                      {internship.location}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-2 text-primary" />
                      {internship.duration}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4 mr-2 text-primary" />
                      {internship.compensation}
                    </div>
                    {internship.applications_count !== undefined && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="h-4 w-4 mr-2 text-primary" />
                        {internship.applications_count} applications
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-medium text-foreground mb-2">Requirements:</p>
                    <div className="flex flex-wrap gap-1">
                      {internship.requirements.slice(0, 3).map((req, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Details
                    </Button>
                    {canApplyToInternships && (
                      <Button 
                        size="sm" 
                        onClick={() => applyToInternship(internship.id, internship.company_name)}
                        className="flex-1 pulse-primary"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Apply
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {internships.length === 0 && (
            <Card className="tech-card border-0 text-center p-12">
              <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No internships available yet</h3>
              <p className="text-muted-foreground">Check back soon for new opportunities.</p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
