import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Video, FileText, Search, Clock, Users, Star, Play, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'template' | 'course' | 'webinar';
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  rating: number;
  downloads: number;
  tags: string[];
  url?: string;
  thumbnail?: string;
}

const sampleResources: Resource[] = [
  {
    id: '1',
    title: 'Startup Fundamentals: From Idea to MVP',
    description: 'Complete guide to validating your startup idea and building your first MVP',
    type: 'course',
    category: 'Fundamentals',
    level: 'Beginner',
    duration: '4 hours',
    rating: 4.8,
    downloads: 1250,
    tags: ['MVP', 'Validation', 'Product Development'],
    url: '#'
  },
  {
    id: '2',
    title: 'Business Model Canvas Template',
    description: 'Professional template to plan and visualize your business model',
    type: 'template',
    category: 'Planning',
    level: 'Beginner',
    duration: '30 min',
    rating: 4.6,
    downloads: 3400,
    tags: ['Business Model', 'Planning', 'Strategy'],
    url: '#'
  },
  {
    id: '3',
    title: 'Fundraising 101: How to Raise Your First Round',
    description: 'Step-by-step guide to preparing for and executing your first funding round',
    type: 'video',
    category: 'Fundraising',
    level: 'Intermediate',
    duration: '2.5 hours',
    rating: 4.9,
    downloads: 890,
    tags: ['Fundraising', 'Pitch Deck', 'Investors'],
    url: '#'
  },
  {
    id: '4',
    title: 'Market Research Framework',
    description: 'Comprehensive framework for conducting effective market research',
    type: 'article',
    category: 'Research',
    level: 'Intermediate',
    duration: '15 min read',
    rating: 4.5,
    downloads: 2100,
    tags: ['Market Research', 'Analysis', 'Validation'],
    url: '#'
  },
  {
    id: '5',
    title: 'Building High-Performance Teams',
    description: 'Learn how to recruit, hire, and manage exceptional startup teams',
    type: 'webinar',
    category: 'Team Building',
    level: 'Advanced',
    duration: '1.5 hours',
    rating: 4.7,
    downloads: 650,
    tags: ['Team', 'Leadership', 'Culture'],
    url: '#'
  },
  {
    id: '6',
    title: 'Product-Market Fit Playbook',
    description: 'Actionable strategies to achieve and measure product-market fit',
    type: 'course',
    category: 'Product',
    level: 'Advanced',
    duration: '6 hours',
    rating: 4.9,
    downloads: 1100,
    tags: ['Product-Market Fit', 'Growth', 'Metrics'],
    url: '#'
  }
];

export default function EducationalResources() {
  const [courses, setCourses] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterResources();
  }, [searchQuery, selectedCategory, selectedLevel, courses]);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const formattedCourses = data.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        type: 'course' as const,
        category: course.category,
        level: course.difficulty as 'Beginner' | 'Intermediate' | 'Advanced',
        duration: `${course.duration_hours || 0} hours`,
        rating: course.rating || 0,
        downloads: course.total_students || 0,
        tags: [course.category, course.difficulty],
        thumbnail: course.thumbnail_url
      }));
      setCourses(formattedCourses);
      setFilteredResources(formattedCourses);
    }
  };

  const enrollInCourse = async (courseId: string, courseTitle: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to enroll in courses.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('course_enrollments')
      .insert({
        student_id: user.id,
        course_id: courseId
      });

    if (error) {
      if (error.code === '23505') {
        toast({
          title: "Already Enrolled",
          description: "You're already enrolled in this course.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to enroll in course. Please try again.",
          variant: "destructive",
        });
      }
      return;
    }

    toast({
      title: "Enrolled Successfully!",
      description: `You've been enrolled in ${courseTitle}`,
    });
  };

  const filterResources = () => {
    let filtered = courses;

    if (searchQuery) {
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(resource => 
        resource.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (selectedLevel !== 'all') {
      filtered = filtered.filter(resource => 
        resource.level.toLowerCase() === selectedLevel.toLowerCase()
      );
    }

    setFilteredResources(filtered);
  };

  const getTypeIcon = (type: string) => {
    return BookOpen;
  };

  const getTypeColor = (type: string) => {
    return 'text-purple-500';
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-500/10 border-green-500/20 text-green-600';
      case 'Intermediate': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600';
      case 'Advanced': return 'bg-red-500/10 border-red-500/20 text-red-600';
      default: return 'bg-gray-500/10 border-gray-500/20 text-gray-600';
    }
  };

  const categories = [...new Set(courses.map(r => r.category))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span>Educational Resources</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Access curated educational content, templates, and courses designed to help you build and scale your startup.
          </p>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-background border border-input rounded-md text-sm min-w-[150px]"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3 py-2 bg-background border border-input rounded-md text-sm min-w-[150px]"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.map((resource) => {
          const TypeIcon = getTypeIcon(resource.type);
          return (
            <Card key={resource.id} className="tech-card border-0 hover:scale-[1.02] transition-transform">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <TypeIcon className={`h-5 w-5 ${getTypeColor(resource.type)}`} />
                    <Badge variant="outline" className="text-xs capitalize">
                      {resource.type}
                    </Badge>
                  </div>
                  <Badge className={getLevelColor(resource.level)} variant="outline">
                    {resource.level}
                  </Badge>
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
                  {resource.title}
                </h3>
                
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {resource.description}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{resource.duration}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    <span>{resource.rating}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Download className="h-3 w-3" />
                    <span>{resource.downloads}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {resource.tags.slice(0, 3).map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <Button className="w-full pulse-primary" size="sm" onClick={() => enrollInCourse(resource.id, resource.title)}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Enroll Now
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredResources.length === 0 && (
        <Card className="tech-card border-0 text-center p-12">
          <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No resources found</h3>
          <p className="text-muted-foreground">Try adjusting your search criteria or filters</p>
        </Card>
      )}

      {/* Learning Path Recommendation */}
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <span>Recommended Learning Path</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Based on your profile and progress, here's a personalized learning path:
          </p>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium text-foreground">Complete Business Model Canvas</h4>
                <p className="text-sm text-muted-foreground">Foundation for your startup strategy</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
              <div className="w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium text-foreground">Market Research Framework</h4>
                <p className="text-sm text-muted-foreground">Validate your market opportunity</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50 border border-muted">
              <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium text-muted-foreground">MVP Development Course</h4>
                <p className="text-sm text-muted-foreground">Build your first product version</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}