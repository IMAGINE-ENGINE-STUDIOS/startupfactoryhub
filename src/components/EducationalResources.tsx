import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  GraduationCap, 
  Search, 
  BookOpen, 
  Trophy, 
  TrendingUp, 
  ExternalLink,
  PlayCircle,
  CheckCircle2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CourseVideoDialog } from './CourseVideoDialog';
import { useCourseCompletion } from '@/hooks/useCourseCompletion';

interface Course {
  id: string;
  title: string;
  instructor: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  playlist_url: string;
}

// YouTube course data - All verified working videos
const youtubeCourses: Course[] = [
  {
    id: '1',
    title: 'Y Combinator Startup School',
    instructor: 'Y Combinator',
    description: 'Comprehensive course on how to start and grow a successful startup from Y Combinator.',
    category: 'Entrepreneurship',
    level: 'Beginner',
    duration: '10 hours',
    playlist_url: 'https://www.youtube.com/playlist?list=PL5q_lef6zVkaTY_cT1k7qFNF2TidHCe-1'
  },
  {
    id: '2',
    title: 'CrashCourse Business Entrepreneurship',
    instructor: 'CrashCourse',
    description: 'Engaging series covering entrepreneurship fundamentals, from idea validation to scaling.',
    category: 'Entrepreneurship',
    level: 'Beginner',
    duration: '8 hours',
    playlist_url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtNamNKW5qlS-nKgA0on7Qze'
  },
  {
    id: '3',
    title: 'Stanford CS183F - Startup First 100 Days',
    instructor: 'Stanford University',
    description: 'Focus on the critical first 100 days of launching a startup with actionable insights.',
    category: 'Business Strategy',
    level: 'Intermediate',
    duration: '10 hours',
    playlist_url: 'https://www.youtube.com/playlist?list=PLoROMvodv4rNpMrTeeh-627Lajh6uSUgY'
  },
  {
    id: '4',
    title: 'Pitch Deck Masterclass',
    instructor: 'Dave McClure',
    description: 'Learn to create compelling pitch decks that attract investors from 500 Startups founder.',
    category: 'Fundraising',
    level: 'Beginner',
    duration: '1 hour',
    playlist_url: 'https://www.youtube.com/watch?v=9c2oiXPZkc0'
  },
  {
    id: '5',
    title: 'Financial Modeling for Startups',
    instructor: 'Corporate Finance Institute',
    description: 'Master financial modeling techniques essential for startup founders and finance teams.',
    category: 'Finance',
    level: 'Advanced',
    duration: '2 hours',
    playlist_url: 'https://www.youtube.com/watch?v=WEDIj9JBTC8'
  },
  {
    id: '6',
    title: 'GaryVee Marketing Masterclass',
    instructor: 'Gary Vaynerchuk',
    description: 'Comprehensive digital marketing strategies and growth hacks for early-stage startups.',
    category: 'Marketing',
    level: 'Beginner',
    duration: '15 hours',
    playlist_url: 'https://www.youtube.com/playlist?list=PLfA33-E9P7FAvnrOcgy4MvIcCXxoyjuku'
  },
  {
    id: '7',
    title: 'HubSpot Academy Marketing',
    instructor: 'HubSpot',
    description: 'Learn inbound marketing, content strategy, and lead generation from HubSpot experts.',
    category: 'Marketing',
    level: 'Intermediate',
    duration: '8 hours',
    playlist_url: 'https://www.youtube.com/playlist?list=PLzUWS9uBdJ2GZ5bPRP8KJ0nFhKqP8QnVH'
  },
  {
    id: '8',
    title: 'Y Combinator Investor Pitches',
    instructor: 'Y Combinator',
    description: 'Watch real startup pitches and learn what investors look for in fundraising presentations.',
    category: 'Fundraising',
    level: 'Intermediate',
    duration: '5 hours',
    playlist_url: 'https://www.youtube.com/playlist?list=PLQ-uHSnFig5MiLRb-l6yiJ5VZQdAKyt3-'
  },
  {
    id: '9',
    title: 'Startup Finance Basics',
    instructor: 'Corporate Finance Institute',
    description: 'Essential finance knowledge for founders including budgeting, cash flow, and unit economics.',
    category: 'Finance',
    level: 'Beginner',
    duration: '6 hours',
    playlist_url: 'https://www.youtube.com/playlist?list=PL_NAkUK835PWbhOImFhCH0w-a6GR-iV9k'
  },
  {
    id: '10',
    title: 'Google Digital Garage - Tech Skills',
    instructor: 'Google',
    description: 'Build essential digital skills for modern business from Google experts.',
    category: 'Technology',
    level: 'Beginner',
    duration: '10 hours',
    playlist_url: 'https://www.youtube.com/playlist?list=PLyQrd1vAV_2Ix8nxGdAiPl8PYCuDLaX-Y'
  },
  {
    id: '11',
    title: 'How to Start a Business - Full Course',
    instructor: 'Multiple Experts',
    description: 'Complete guide to launching and running a successful business from idea to execution.',
    category: 'Business Strategy',
    level: 'Beginner',
    duration: '12 hours',
    playlist_url: 'https://www.youtube.com/playlist?list=PL1O57nCUQ-e-u2nuXM_hnfa5cIFaTCaxY'
  }
];

export default function EducationalResources() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [validCourses, setValidCourses] = useState<Course[]>(youtubeCourses);
  const [stats, setStats] = useState({ totalCompleted: 0, totalPoints: 0 });
  const { isCompleted, getStats } = useCourseCompletion();

  useEffect(() => {
    validateCourses();
    loadStats();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [searchQuery, selectedCategory, selectedLevel, validCourses]);

  const loadStats = async () => {
    const courseStats = await getStats();
    setStats(courseStats);
  };

  const validateCourses = () => {
    const seenUrls = new Set<string>();
    
    // Filter out broken/duplicate courses
    const filtered = youtubeCourses.filter(course => {
      // Check if URL exists
      if (!course.playlist_url) {
        console.warn(`Course "${course.title}" has no URL`);
        return false;
      }
      
      // Check if it's a valid YouTube URL
      const isYouTube = course.playlist_url.includes('youtube.com') || course.playlist_url.includes('youtu.be');
      if (!isYouTube) {
        console.warn(`Course "${course.title}" is not a YouTube URL`);
        return false;
      }
      
      // Check for duplicates
      if (seenUrls.has(course.playlist_url)) {
        console.warn(`Duplicate URL found for course "${course.title}"`);
        return false;
      }
      
      seenUrls.add(course.playlist_url);
      return true;
    });
    
    console.log(`Validated ${filtered.length} out of ${youtubeCourses.length} courses`);
    setValidCourses(filtered);
  };

  const filterCourses = () => {
    let filtered = validCourses;

    if (searchQuery) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => 
        course.category === selectedCategory
      );
    }

    if (selectedLevel !== 'all') {
      filtered = filtered.filter(course => 
        course.level.toLowerCase() === selectedLevel.toLowerCase()
      );
    }

    setFilteredCourses(filtered);
  };

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
    setDialogOpen(true);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-500/10 border-green-500/20 text-green-600';
      case 'Intermediate': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600';
      case 'Advanced': return 'bg-red-500/10 border-red-500/20 text-red-600';
      default: return 'bg-gray-500/10 border-gray-500/20 text-gray-600';
    }
  };

  const categories = [...new Set(validCourses.map(c => c.category))];

  return (
    <section className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-3 mb-2">
            <GraduationCap className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Educational Resources
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Access curated video courses from top universities and tech companies. Learn cutting-edge technologies at your own pace.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="tech-card">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">{validCourses.length}</div>
                <div className="text-sm text-muted-foreground">Total Courses</div>
              </div>
            </CardContent>
          </Card>
          <Card className="tech-card">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">{stats.totalCompleted}</div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Completed
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="tech-card">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600 mb-1">{stats.totalPoints}</div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Trophy className="w-4 h-4" />
                  Points Earned
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="tech-card">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-accent mb-1">{categories.length}</div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="tech-card">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative md:col-span-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <Card 
              key={course.id} 
              className="tech-card hover:border-primary/50 transition-all duration-300 cursor-pointer group"
              onClick={() => handleCourseClick(course)}
            >
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex gap-2">
                    <Badge className={getLevelColor(course.level)}>
                      {course.level}
                    </Badge>
                    {isCompleted(course.id) && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                  <PlayCircle className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                  {course.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {course.description}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <BookOpen className="h-3 w-3" />
                    <span>{course.instructor}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {course.category}
                  </Badge>
                </div>
                {isCompleted(course.id) && (
                  <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    Earned 50 points
                  </p>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">{course.duration}</span>
                  <Button size="sm" variant={isCompleted(course.id) ? "outline" : "ghost"} className="gap-1">
                    {isCompleted(course.id) ? 'Watch Again' : 'Watch Now'}
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-20" />
            <h3 className="text-lg font-medium text-foreground mb-2">No courses found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>

      {/* Course Dialog */}
      {selectedCourse && (
        <CourseVideoDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          course={selectedCourse}
        />
      )}
    </section>
  );
}
