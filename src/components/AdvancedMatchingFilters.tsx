import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, SlidersHorizontal } from 'lucide-react';

interface MatchingFilters {
  industry: string[];
  stage: string[];
  location: string;
  matchScore: number;
  skills: string[];
}

export default function AdvancedMatchingFilters() {
  const [filters, setFilters] = useState<MatchingFilters>({
    industry: [],
    stage: [],
    location: 'any',
    matchScore: 70,
    skills: [],
  });

  const industries = ['AI/ML', 'FinTech', 'HealthTech', 'EdTech', 'E-commerce', 'SaaS'];
  const stages = ['Idea', 'MVP', 'Seed', 'Series A', 'Series B+'];
  const skillOptions = ['Product', 'Engineering', 'Marketing', 'Sales', 'Design', 'Operations'];

  const toggleArrayFilter = (key: keyof MatchingFilters, value: string) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setFilters({ ...filters, [key]: updated });
  };

  const clearFilters = () => {
    setFilters({
      industry: [],
      stage: [],
      location: 'any',
      matchScore: 70,
      skills: [],
    });
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5" />
          <h3 className="font-semibold">Advanced Filters</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear All
        </Button>
      </div>

      <div className="space-y-4">
        {/* Industry Filter */}
        <div className="space-y-2">
          <Label>Industry Focus</Label>
          <div className="flex flex-wrap gap-2">
            {industries.map(industry => (
              <Badge
                key={industry}
                variant={filters.industry.includes(industry) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleArrayFilter('industry', industry)}
              >
                {industry}
                {filters.industry.includes(industry) && (
                  <X className="ml-1 h-3 w-3" />
                )}
              </Badge>
            ))}
          </div>
        </div>

        {/* Stage Filter */}
        <div className="space-y-2">
          <Label>Startup Stage</Label>
          <div className="flex flex-wrap gap-2">
            {stages.map(stage => (
              <Badge
                key={stage}
                variant={filters.stage.includes(stage) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleArrayFilter('stage', stage)}
              >
                {stage}
                {filters.stage.includes(stage) && (
                  <X className="ml-1 h-3 w-3" />
                )}
              </Badge>
            ))}
          </div>
        </div>

        {/* Skills Filter */}
        <div className="space-y-2">
          <Label>Skills Needed</Label>
          <div className="flex flex-wrap gap-2">
            {skillOptions.map(skill => (
              <Badge
                key={skill}
                variant={filters.skills.includes(skill) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleArrayFilter('skills', skill)}
              >
                {skill}
                {filters.skills.includes(skill) && (
                  <X className="ml-1 h-3 w-3" />
                )}
              </Badge>
            ))}
          </div>
        </div>

        {/* Location Filter */}
        <div className="space-y-2">
          <Label>Location</Label>
          <Select
            value={filters.location}
            onValueChange={(value) => setFilters({ ...filters, location: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any Location</SelectItem>
              <SelectItem value="remote">Remote Only</SelectItem>
              <SelectItem value="us">United States</SelectItem>
              <SelectItem value="eu">Europe</SelectItem>
              <SelectItem value="asia">Asia</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Match Score Filter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Minimum Match Score</Label>
            <span className="text-sm font-medium">{filters.matchScore}%</span>
          </div>
          <Slider
            value={[filters.matchScore]}
            onValueChange={([value]) => setFilters({ ...filters, matchScore: value })}
            min={0}
            max={100}
            step={5}
          />
        </div>
      </div>

      <Button className="w-full">Apply Filters</Button>
    </Card>
  );
}
