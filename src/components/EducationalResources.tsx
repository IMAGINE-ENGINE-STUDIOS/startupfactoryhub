import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  GraduationCap,
  Search,
  BookOpen,
  Trophy,
  PlayCircle,
  CheckCircle2,
  Sparkles,
  Flame,
  Clock,
  TrendingUp,
  Zap,
  Layers,
} from 'lucide-react';
import { CourseVideoDialog } from './CourseVideoDialog';
import { useCourseCompletion } from '@/hooks/useCourseCompletion';
import { cn } from '@/lib/utils';

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

const youtubeCourses: Course[] = [
  { id: '1', title: 'Y Combinator Startup School', instructor: 'Y Combinator', description: 'Comprehensive course on how to start and grow a successful startup from Y Combinator.', category: 'Entrepreneurship', level: 'Beginner', duration: '10 hours', playlist_url: 'https://www.youtube.com/playlist?list=PL5q_lef6zVkaTY_cT1k7qFNF2TidHCe-1' },
  { id: '2', title: 'CrashCourse Business Entrepreneurship', instructor: 'CrashCourse', description: 'Engaging series covering entrepreneurship fundamentals, from idea validation to scaling.', category: 'Entrepreneurship', level: 'Beginner', duration: '8 hours', playlist_url: 'https://www.youtube.com/playlist?list=PL8dPuuaLjXtNamNKW5qlS-nKgA0on7Qze' },
  { id: '4', title: 'Financial Modeling for Startups', instructor: 'Corporate Finance Institute', description: 'Master financial modeling techniques essential for startup founders and finance teams.', category: 'Finance', level: 'Advanced', duration: '2 hours', playlist_url: 'https://www.youtube.com/watch?v=WEDIj9JBTC8' },
  { id: '5', title: 'GaryVee Marketing Masterclass', instructor: 'Gary Vaynerchuk', description: 'Comprehensive digital marketing strategies and growth hacks for early-stage startups.', category: 'Marketing', level: 'Beginner', duration: '15 hours', playlist_url: 'https://www.youtube.com/playlist?list=PLfA33-E9P7FAvnrOcgy4MvIcCXxoyjuku' },
  { id: '6', title: 'Startup Essentials Course', instructor: 'Expert Instructor', description: 'Essential knowledge and strategies for building successful startups.', category: 'Entrepreneurship', level: 'Beginner', duration: '2 hours', playlist_url: 'https://www.youtube.com/watch?v=oWZbWzAyHAE' },
  { id: '7', title: 'Business Growth Strategies', instructor: 'Industry Expert', description: 'Learn proven strategies to scale and grow your business effectively.', category: 'Entrepreneurship', level: 'Intermediate', duration: '1.5 hours', playlist_url: 'https://www.youtube.com/watch?v=zBUhQPPS9AY' },
  { id: '8', title: 'Advanced Startup Tactics', instructor: 'Business Leader', description: 'Advanced techniques and insights for startup success and scaling.', category: 'Entrepreneurship', level: 'Advanced', duration: '2 hours', playlist_url: 'https://www.youtube.com/watch?v=u36A-YTxiOw' },
  { id: '9', title: 'Startup Fundamentals', instructor: 'Industry Expert', description: 'Core fundamentals and principles for building successful startups.', category: 'Entrepreneurship', level: 'Beginner', duration: '1.5 hours', playlist_url: 'https://www.youtube.com/watch?v=aGPzQDfKcIU' },
  { id: '10', title: 'Business Strategy & Innovation', instructor: 'Business Expert', description: 'Strategic approaches and innovative methods for business development.', category: 'Entrepreneurship', level: 'Intermediate', duration: '2 hours', playlist_url: 'https://www.youtube.com/watch?v=ioSW__2I-B8' },
];

const levelStyles: Record<string, string> = {
  Beginner: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
  Intermediate: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30',
  Advanced: 'from-rose-500/20 to-pink-500/20 text-rose-400 border-rose-500/30',
};

const categoryGradients: Record<string, string> = {
  Entrepreneurship: 'from-primary/30 via-primary/10 to-transparent',
  Finance: 'from-emerald-500/30 via-emerald-500/10 to-transparent',
  Marketing: 'from-violet-500/30 via-violet-500/10 to-transparent',
};

export default function EducationalResources() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [stats, setStats] = useState({ totalCompleted: 0, totalPoints: 0 });
  const { isCompleted, getStats } = useCourseCompletion();

  useEffect(() => {
    getStats().then(setStats);
  }, []);

  const validCourses = useMemo(() => {
    const seen = new Set<string>();
    return youtubeCourses.filter(c => {
      if (!c.playlist_url || seen.has(c.playlist_url)) return false;
      seen.add(c.playlist_url);
      return true;
    });
  }, []);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(validCourses.map(c => c.category)))],
    [validCourses],
  );

  const filteredCourses = useMemo(() => {
    return validCourses.filter(c => {
      const matchesSearch =
        !searchQuery ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || c.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [validCourses, searchQuery, selectedCategory]);

  const featured = filteredCourses[0];
  const rest = filteredCourses.slice(1);

  const completionPct = validCourses.length
    ? Math.round((stats.totalCompleted / validCourses.length) * 100)
    : 0;

  const handleCourseClick = (course: Course) => {
    setSelectedCourse(course);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Hero progress strip ──────────────────────────────────────── */}
      <div className="relative tech-card border-0 rounded-2xl p-5 sm:p-6 overflow-hidden">
        <div className="absolute -top-24 -right-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5 items-center">
          <div className="space-y-3">
            <Badge className="bg-primary/15 text-primary border-primary/30 gap-1.5 px-2.5 py-1">
              <Sparkles className="w-3 h-3" /> Next-gen Learning
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Learn. Build. <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">Launch.</span>
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl">
              Curated masterclasses from world-class founders, investors and operators — designed to compound into real startup skill.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <Progress value={completionPct} className="h-2 flex-1 max-w-md" />
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                {completionPct}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 lg:gap-3 lg:min-w-[340px]">
            <StatChip icon={Layers} value={validCourses.length} label="Courses" tone="text-primary" />
            <StatChip icon={CheckCircle2} value={stats.totalCompleted} label="Done" tone="text-emerald-400" />
            <StatChip icon={Trophy} value={stats.totalPoints} label="XP" tone="text-amber-400" />
          </div>
        </div>
      </div>

      {/* ── Search + category chips ──────────────────────────────────── */}
      <div className="tech-card border-0 rounded-2xl p-3 sm:p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search courses, topics, instructors…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-background/40 border-border/50"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {categories.map(cat => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'shrink-0 h-8 px-3.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all',
                  active
                    ? 'bg-primary text-primary-foreground shadow-[0_0_18px_hsl(var(--primary)/0.45)]'
                    : 'bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                )}
              >
                {cat === 'all' ? 'All Tracks' : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Featured course ──────────────────────────────────────────── */}
      {featured && (
        <button
          onClick={() => handleCourseClick(featured)}
          className="group relative w-full text-left tech-card border-0 rounded-2xl overflow-hidden"
        >
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-br opacity-90 transition-opacity group-hover:opacity-100',
              categoryGradients[featured.category] ?? 'from-primary/30 via-primary/10 to-transparent',
            )}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.25),transparent_60%)]" />

          <div className="relative p-5 sm:p-7 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-5 items-center">
            <div className="space-y-3">
              <Badge className="bg-background/60 backdrop-blur-sm text-foreground border-border/50 gap-1.5">
                <Flame className="w-3 h-3 text-orange-400" /> Featured this week
              </Badge>
              <h3 className="text-xl sm:text-2xl font-bold leading-tight group-hover:text-primary transition-colors">
                {featured.title}
              </h3>
              <p className="text-sm text-muted-foreground max-w-2xl line-clamp-2">
                {featured.description}
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> {featured.instructor}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {featured.duration}</span>
                <Badge
                  className={cn(
                    'bg-gradient-to-r border text-[10px] uppercase tracking-wider',
                    levelStyles[featured.level],
                  )}
                >
                  {featured.level}
                </Badge>
              </div>
            </div>

            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-primary/40 blur-2xl rounded-full" />
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center shadow-[0_0_32px_hsl(var(--primary)/0.55)] group-hover:scale-105 transition-transform">
                <PlayCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" strokeWidth={1.5} />
              </div>
            </div>
          </div>
        </button>
      )}

      {/* ── Course grid ──────────────────────────────────────────────── */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rest.map(course => {
            const done = isCompleted(course.id);
            return (
              <button
                key={course.id}
                onClick={() => handleCourseClick(course)}
                className="group relative text-left tech-card border-0 rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_32px_hsl(var(--primary)/0.25)]"
              >
                <div
                  className={cn(
                    'absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r opacity-70',
                    course.category === 'Finance'
                      ? 'from-emerald-500 to-teal-400'
                      : course.category === 'Marketing'
                        ? 'from-violet-500 to-fuchsia-400'
                        : 'from-primary to-emerald-400',
                  )}
                />

                <div className="flex items-start justify-between mb-3">
                  <div
                    className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105',
                      done
                        ? 'bg-gradient-to-br from-primary to-emerald-500 text-white shadow-[0_0_20px_hsl(var(--primary)/0.45)]'
                        : 'bg-primary/10 text-primary',
                    )}
                  >
                    {done ? <CheckCircle2 className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                  </div>
                  <Badge
                    className={cn(
                      'bg-gradient-to-r border text-[10px] uppercase tracking-wider',
                      levelStyles[course.level],
                    )}
                  >
                    {course.level}
                  </Badge>
                </div>

                <h4 className="font-semibold text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {course.title}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5">
                  {course.description}
                </p>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> {course.duration}
                  </span>
                  <span className="flex items-center gap-1 text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {done ? 'Watch again' : 'Start'} <Zap className="w-3 h-3" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {filteredCourses.length === 0 && (
        <div className="tech-card border-0 rounded-2xl text-center py-16 px-6">
          <BookOpen className="h-14 w-14 mx-auto mb-3 text-muted-foreground/40" />
          <h3 className="font-semibold mb-1">No courses match</h3>
          <p className="text-sm text-muted-foreground">Try a different track or clear your search.</p>
        </div>
      )}

      {selectedCourse && (
        <CourseVideoDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          course={selectedCourse}
        />
      )}
    </div>
  );
}

function StatChip({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: any;
  value: number;
  label: string;
  tone: string;
}) {
  return (
    <div className="relative rounded-xl bg-background/40 border border-border/40 px-3 py-2.5 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className={cn('w-3 h-3', tone)} />
        {label}
      </div>
      <div className={cn('text-xl font-bold tabular-nums mt-0.5', tone)}>{value}</div>
    </div>
  );
}
