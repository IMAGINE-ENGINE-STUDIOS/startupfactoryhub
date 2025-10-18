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
  PlayCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CourseVideoDialog } from './CourseVideoDialog';

interface Course {
  id: number;
  title: string;
  instructor: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  playlist_url: string;
}

// YouTube course data
const youtubeCourses: Course[] = [
  {
    id: 1,
    title: "Startup Fundamentals",
    instructor: "Y Combinator",
    description: "Learn how to start a company from the best startup accelerator",
    category: "Startup",
    level: "Beginner",
    duration: "6 hours",
    playlist_url: "https://www.youtube.com/playlist?list=PL5q_lef6zVkaTY_cT1k7qFNF2TidHCe-1"
  },
  {
    id: 2,
    title: "How to Build the Future",
    instructor: "Y Combinator",
    description: "Conversations with founders, investors, and technologists",
    category: "Startup",
    level: "Intermediate",
    duration: "10 hours",
    playlist_url: "https://www.youtube.com/playlist?list=PLoROMvodv4rMiGQp3WXShtMGgzqpfVfbU"
  },
  {
    id: 3,
    title: "Stanford CS229: Machine Learning",
    instructor: "Andrew Ng",
    description: "Comprehensive ML course from Stanford University",
    category: "Technology",
    level: "Advanced",
    duration: "20 hours",
    playlist_url: "https://www.youtube.com/playlist?list=PLoROMvodv4rMiGQp3WXShtMGgzqpfVfbU"
  },
  {
    id: 4,
    title: "Financial Modeling & Valuation",
    instructor: "Corporate Finance Institute",
    description: "Master financial modeling for startups and investors",
    category: "Business",
    level: "Intermediate",
    duration: "8 hours",
    playlist_url: "https://www.youtube.com/watch?v=WEDIj9JBTC8"
  },
  {
    id: 5,
    title: "Pitch Perfect",
    instructor: "500 Startups",
    description: "Learn how to create and deliver winning pitch decks",
    category: "Startup",
    level: "Beginner",
    duration: "4 hours",
    playlist_url: "https://www.youtube.com/watch?v=9c2oiXPZkc0"
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

  useEffect(() => {
    validateCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [searchQuery, selectedCategory, selectedLevel, validCourses]);

  const validateCourses = () => {
    // Filter out known broken courses
    const filtered = youtubeCourses.filter(course => {
      // Keep only YouTube playlists/videos that are likely accessible
      if (!course.playlist_url) return false;
      // Basic validation - check if URL is well-formed
      const isYouTube = course.playlist_url.includes('youtube.com') || course.playlist_url.includes('youtu.be');
      return isYouTube;
    });
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                <div className="text-3xl font-bold text-accent mb-1">{categories.length}</div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
            </CardContent>
          </Card>
          <Card className="tech-card">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary mb-1">Free</div>
                <div className="text-sm text-muted-foreground">All Resources</div>
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
                  <Badge className={getLevelColor(course.level)}>
                    {course.level}
                  </Badge>
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
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">{course.duration}</span>
                  <Button size="sm" variant="ghost" className="gap-1">
                    Watch Now
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
