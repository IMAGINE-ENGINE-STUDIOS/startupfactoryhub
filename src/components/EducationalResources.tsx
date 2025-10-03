import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BookOpen, Video, Search, Clock, Play } from 'lucide-react';
import { CourseVideoDialog } from './CourseVideoDialog';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  playlist_url: string;
  provider: string;
}

const youtubeCourses: Course[] = [
  // Quantum Computing
  {
    id: 'qc-1',
    title: 'Quantum Computing Fundamentals',
    description: 'Learn the foundations of quantum computing and quantum mechanics',
    category: 'Quantum Computing',
    level: 'Beginner',
    duration: '10+ hours',
    playlist_url: 'https://www.youtube.com/embed/videoseries?list=PLQVvvaa0QuDe9nqlirjacLkBYdgc2inh3',
    provider: 'Sentdex'
  },
  {
    id: 'qc-2',
    title: 'Advanced Quantum Computing',
    description: 'Deep dive into quantum algorithms and quantum information theory',
    category: 'Quantum Computing',
    level: 'Advanced',
    duration: '15+ hours',
    playlist_url: 'https://www.youtube.com/embed/videoseries?list=PLD7HFcN7LXReBf5nhL-zlArGYh1yW6EUk',
    provider: 'MIT OpenCourseWare'
  },
  {
    id: 'qc-3',
    title: 'Google Quantum AI Research',
    description: 'Latest research and developments from Google Quantum AI',
    category: 'Quantum Computing',
    level: 'Advanced',
    duration: '20+ hours',
    playlist_url: 'https://www.youtube.com/embed?listType=user_uploads&list=GoogleQuantumAI',
    provider: 'Google Quantum AI'
  },
  // Artificial Intelligence
  {
    id: 'ai-1',
    title: 'Machine Learning Fundamentals',
    description: 'Complete introduction to machine learning and AI concepts',
    category: 'Artificial Intelligence',
    level: 'Beginner',
    duration: '12+ hours',
    playlist_url: 'https://www.youtube.com/embed/videoseries?list=PLAwxTw4SYaPmfRDzSX3b_mF0HSY3nYIPU',
    provider: 'MIT'
  },
  {
    id: 'ai-2',
    title: 'Deep Learning Specialization',
    description: 'Master deep learning and neural networks',
    category: 'Artificial Intelligence',
    level: 'Intermediate',
    duration: '18+ hours',
    playlist_url: 'https://www.youtube.com/embed/videoseries?list=PLfYUBJiXbdtRFMZ4z6xN4TrT0lb8yKUik',
    provider: 'Lex Fridman'
  },
  {
    id: 'ai-3',
    title: 'Stanford AI Course',
    description: 'Comprehensive AI course from Stanford University',
    category: 'Artificial Intelligence',
    level: 'Advanced',
    duration: '25+ hours',
    playlist_url: 'https://www.youtube.com/embed/videoseries?list=PLoROMvodv4rMiGQp3WXShtMGgzqpfVfbU',
    provider: 'Stanford'
  },
  // Virtual Reality
  {
    id: 'vr-1',
    title: 'VR Development Introduction',
    description: 'Learn to build virtual reality experiences and applications',
    category: 'Virtual Reality',
    level: 'Beginner',
    duration: '8+ hours',
    playlist_url: 'https://www.youtube.com/embed/videoseries?list=PLX2vGYjWbI0RrDT0Y6rU3tixp2MmXo0Aa',
    provider: 'Unity'
  },
  {
    id: 'vr-2',
    title: 'Advanced VR Development',
    description: 'Advanced techniques in virtual reality development',
    category: 'Virtual Reality',
    level: 'Advanced',
    duration: '10+ hours',
    playlist_url: 'https://www.youtube.com/embed/videoseries?list=PLAwxTw4SYaPmFD9yOJA6rYg9rPzLGMH0h',
    provider: 'MIT'
  },
  // Photonics
  {
    id: 'ph-1',
    title: 'Photonics and Optical Engineering',
    description: 'Introduction to photonics, optics, and laser technology',
    category: 'Photonics',
    level: 'Intermediate',
    duration: '14+ hours',
    playlist_url: 'https://www.youtube.com/embed/videoseries?list=PLoROMvodv4rMTPgM3W0qL2Bf1a-aJTj7Y',
    provider: 'Stanford'
  },
  // Satellites
  {
    id: 'sat-1',
    title: 'Satellite Technology and Communications',
    description: 'Learn about satellite systems, orbits, and communications',
    category: 'Satellites',
    level: 'Beginner',
    duration: '12+ hours',
    playlist_url: 'https://www.youtube.com/embed/videoseries?list=PL4RjWH6xBVAZ3l-z5eT0aKxJv_5JQ1z7d',
    provider: 'NASA'
  },
  {
    id: 'sat-2',
    title: 'Advanced Satellite Systems',
    description: 'Deep dive into satellite engineering and space technology',
    category: 'Satellites',
    level: 'Advanced',
    duration: '16+ hours',
    playlist_url: 'https://www.youtube.com/embed/videoseries?list=PLbyvawxScNbtS7hZKbn9hEiM-8r6hFntT',
    provider: 'ESA'
  },
  // Robotics
  {
    id: 'rob-1',
    title: 'Introduction to Robotics',
    description: 'Fundamentals of robotics, kinematics, and control systems',
    category: 'Robotics',
    level: 'Beginner',
    duration: '10+ hours',
    playlist_url: 'https://www.youtube.com/embed/videoseries?list=PLkZYeFmDuaN3Mpt1J_sOdrMZzeH7zSnpM',
    provider: 'ROS'
  },
  {
    id: 'rob-2',
    title: 'MIT Robotics Course',
    description: 'Comprehensive robotics course from MIT',
    category: 'Robotics',
    level: 'Intermediate',
    duration: '20+ hours',
    playlist_url: 'https://www.youtube.com/embed/videoseries?list=PLUl4u3cNGP61O7HkcF7UImpM0cR_XgXhg',
    provider: 'MIT'
  },
  {
    id: 'rob-3',
    title: 'Advanced Robot Manipulation',
    description: 'Advanced topics in robot manipulation and planning',
    category: 'Robotics',
    level: 'Advanced',
    duration: '18+ hours',
    playlist_url: 'https://www.youtube.com/embed/videoseries?list=PL2uR0HYhP-vkEzG3d8V9IPeZWZrs3u7je',
    provider: 'MIT'
  },
  // Cloud & Networking
  {
    id: 'cloud-1',
    title: 'Cloud Computing Fundamentals',
    description: 'Complete guide to cloud computing, AWS, Azure, and cloud architecture',
    category: 'Cloud & Networking',
    level: 'Beginner',
    duration: '12+ hours',
    playlist_url: 'https://www.youtube.com/embed/videoseries?list=PLxCzCOWd7aiHRHVUtR-O52MsrdUSrzuy4',
    provider: 'Gate Smashers'
  },
  {
    id: 'cloud-2',
    title: 'Computer Networking Complete Course',
    description: 'In-depth networking concepts, protocols, and network security',
    category: 'Cloud & Networking',
    level: 'Intermediate',
    duration: '15+ hours',
    playlist_url: 'https://www.youtube.com/embed/videoseries?list=PL9ooVrP1hQOFtZ5oAAeOgi_nH-txMcDMu',
    provider: 'Edureka'
  },
  {
    id: 'cloud-3',
    title: 'AWS Certified Solutions Architect',
    description: 'Prepare for AWS certification with hands-on cloud architecture',
    category: 'Cloud & Networking',
    level: 'Advanced',
    duration: '10+ hours',
    playlist_url: 'https://www.youtube.com/embed/lvZk_sc8u5I',
    provider: 'freeCodeCamp'
  },
  {
    id: 'cloud-4',
    title: 'DevOps and Cloud Engineering',
    description: 'Master DevOps practices and cloud infrastructure deployment',
    category: 'Cloud & Networking',
    level: 'Advanced',
    duration: '8+ hours',
    playlist_url: 'https://www.youtube.com/embed/ksDAQX6MbeE',
    provider: 'TechWorld with Nana'
  },
  // Biotech & Genetics
  {
    id: 'bio-1',
    title: 'Introduction to Biotechnology',
    description: 'Fundamentals of biotechnology, genetic engineering, and applications',
    category: 'Biotech & Genetics',
    level: 'Beginner',
    duration: '10+ hours',
    playlist_url: 'https://www.youtube.com/embed/videoseries?list=PL5rTEahBdxV6prB_iWNU8N2-L5XAktld8',
    provider: 'BiologyWala'
  },
  {
    id: 'bio-2',
    title: 'Genetics and Molecular Biology',
    description: 'Deep dive into genetics, DNA, and molecular biology concepts',
    category: 'Biotech & Genetics',
    level: 'Intermediate',
    duration: '12+ hours',
    playlist_url: 'https://www.youtube.com/embed/videoseries?list=PL9fwcf7k-_bGhAQWZ7GNu7ijMKn6Sfk4a',
    provider: 'Shomu\'s Biology'
  },
  {
    id: 'bio-3',
    title: 'CRISPR Gene Editing Explained',
    description: 'Understanding CRISPR technology and gene editing applications',
    category: 'Biotech & Genetics',
    level: 'Intermediate',
    duration: '1 hour',
    playlist_url: 'https://www.youtube.com/embed/rZjwF5z-Xfw',
    provider: 'Nature Video'
  },
  {
    id: 'bio-4',
    title: 'Synthetic Biology and Bioengineering',
    description: 'Learn about synthetic biology and designing biological systems',
    category: 'Biotech & Genetics',
    level: 'Advanced',
    duration: '1.5 hours',
    playlist_url: 'https://www.youtube.com/embed/vnm99DUxWd0',
    provider: 'MIT'
  },
  {
    id: 'bio-5',
    title: 'Bioinformatics and Computational Biology',
    description: 'Computational approaches to analyzing biological data',
    category: 'Biotech & Genetics',
    level: 'Advanced',
    duration: '14+ hours',
    playlist_url: 'https://www.youtube.com/embed/videoseries?list=PLyjWMictIvv213sE09nfco42c_sKiDK5h',
    provider: 'FreeCodeCamp'
  },
  {
    id: 'bio-6',
    title: 'DNA Sequencing and Genomics',
    description: 'Understanding DNA sequencing technologies and genomic analysis',
    category: 'Biotech & Genetics',
    level: 'Intermediate',
    duration: '1 hour',
    playlist_url: 'https://www.youtube.com/embed/OVf_ASEGuns',
    provider: 'Illumina'
  },
  // Cybersecurity
  {
    id: 'cyber-1',
    title: 'Cybersecurity Fundamentals',
    description: 'Complete introduction to cybersecurity concepts and practices',
    category: 'Cybersecurity',
    level: 'Beginner',
    duration: '15+ hours',
    playlist_url: 'https://www.youtube.com/embed/videoseries?list=PL_RcVnBPGmSLAGyNa6wiAf8bbVwxYYzCi',
    provider: 'Simply Cyber'
  },
  {
    id: 'cyber-2',
    title: 'Ethical Hacking Complete Course',
    description: 'Learn ethical hacking, penetration testing, and security assessment',
    category: 'Cybersecurity',
    level: 'Intermediate',
    duration: '18+ hours',
    playlist_url: 'https://www.youtube.com/embed/videoseries?list=PL9ooVrP1hQOGPQVeapGsJCktzIO4DtI4_',
    provider: 'Edureka'
  },
  {
    id: 'cyber-3',
    title: 'Network Security & Cryptography',
    description: 'Deep dive into network security protocols and cryptographic systems',
    category: 'Cybersecurity',
    level: 'Advanced',
    duration: '4+ hours',
    playlist_url: 'https://www.youtube.com/embed/kUovJpWqEMk',
    provider: 'Professor Messer'
  },
  {
    id: 'cyber-4',
    title: 'Web Application Security',
    description: 'Learn to identify and prevent web application vulnerabilities',
    category: 'Cybersecurity',
    level: 'Advanced',
    duration: '3+ hours',
    playlist_url: 'https://www.youtube.com/embed/X3DVaMnl5n8',
    provider: 'OWASP'
  },
  {
    id: 'cyber-5',
    title: 'Advanced Penetration Testing',
    description: 'Master advanced penetration testing techniques and methodologies',
    category: 'Cybersecurity',
    level: 'Advanced',
    duration: '20+ hours',
    playlist_url: 'https://www.youtube.com/embed/videoseries?list=PL_pbwdIyffslM_o92NwkaUzD7C6Fekx26',
    provider: 'HackerSploit'
  },
  // Defense & Intelligence
  {
    id: 'def-1',
    title: 'Defense Technology & Systems',
    description: 'Overview of modern defense technologies and military systems',
    category: 'Defense & Intelligence',
    level: 'Intermediate',
    duration: '2+ hours',
    playlist_url: 'https://www.youtube.com/embed/atxKIvSQJ-0',
    provider: 'Defense Tech'
  },
  {
    id: 'def-2',
    title: 'Intelligence Analysis and Operations',
    description: 'Understanding intelligence gathering and analysis methodologies',
    category: 'Defense & Intelligence',
    level: 'Advanced',
    duration: '1.5+ hours',
    playlist_url: 'https://www.youtube.com/embed/WJlGOhIIPuE',
    provider: 'Intelligence Studies'
  },
  {
    id: 'def-3',
    title: 'Strategic Defense Systems',
    description: 'Learn about strategic defense planning and national security',
    category: 'Defense & Intelligence',
    level: 'Advanced',
    duration: '2+ hours',
    playlist_url: 'https://www.youtube.com/embed/8LmY6Lq4Rvs',
    provider: 'Military Analysis'
  }
];

export default function EducationalResources() {
  const [filteredCourses, setFilteredCourses] = useState<Course[]>(youtubeCourses);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    filterCourses();
  }, [searchQuery, selectedCategory, selectedLevel]);

  const filterCourses = () => {
    let filtered = youtubeCourses;

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

  const categories = [...new Set(youtubeCourses.map(c => c.category))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <BookOpen className="h-7 w-7 text-primary" />
            <span>Educational Resources</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Access curated video courses from top universities and tech companies. Learn cutting-edge technologies at your own pace.
          </p>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-background border border-input rounded-md text-sm min-w-[200px]"
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{youtubeCourses.length}</p>
                <p className="text-sm text-muted-foreground">Total Courses</p>
              </div>
              <Video className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-sm text-muted-foreground">Categories</p>
              </div>
              <BookOpen className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">200+</p>
                <p className="text-sm text-muted-foreground">Hours Content</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">Free</p>
                <p className="text-sm text-muted-foreground">All Access</p>
              </div>
              <Play className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card 
            key={course.id} 
            className="border-0 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer group"
            onClick={() => handleCourseClick(course)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  <Badge variant="outline" className="text-xs">
                    Video Course
                  </Badge>
                </div>
                <Badge className={getLevelColor(course.level)} variant="outline">
                  {course.level}
                </Badge>
              </div>

              <h3 className="text-lg font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                {course.title}
              </h3>
              
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {course.description}
              </p>

              <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{course.duration}</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {course.provider}
                </Badge>
              </div>

              <Badge variant="secondary" className="w-full justify-center">
                {course.category}
              </Badge>

              <Button className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors" variant="outline">
                <Play className="h-4 w-4 mr-2" />
                Watch Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <Card className="border-0 text-center p-12">
          <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-semibold mb-2">No courses found</h3>
          <p className="text-muted-foreground">Try adjusting your search criteria or filters</p>
        </Card>
      )}

      {/* Course Video Dialog */}
      <CourseVideoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        course={selectedCourse}
      />
    </div>
  );
}