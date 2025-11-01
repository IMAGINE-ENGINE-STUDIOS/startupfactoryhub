import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, Circle } from 'lucide-react';

interface TRLTrackerProps {
  currentLevel: number;
  onLevelUpdate: (level: number) => void;
  disabled?: boolean;
}

const trlLevels = [
  { level: 1, title: 'Basic Principles', description: 'Basic principles observed and reported' },
  { level: 2, title: 'Concept Formulated', description: 'Technology concept and/or application formulated' },
  { level: 3, title: 'Proof of Concept', description: 'Experimental proof of concept demonstrated' },
  { level: 4, title: 'Lab Validation', description: 'Technology validated in laboratory environment' },
  { level: 5, title: 'Relevant Environment', description: 'Technology validated in relevant environment' },
  { level: 6, title: 'Demonstration', description: 'Technology demonstrated in relevant environment' },
  { level: 7, title: 'Prototype Demo', description: 'System prototype demonstration in operational environment' },
  { level: 8, title: 'System Complete', description: 'System complete and qualified through test and demonstration' },
  { level: 9, title: 'System Proven', description: 'Actual system proven through successful mission operations' },
  { level: 10, title: 'Production Ready', description: 'System ready for full commercial deployment' }
];

export default function TRLTracker({ currentLevel, onLevelUpdate, disabled = false }: TRLTrackerProps) {
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);

  const handleLevelClick = (level: number) => {
    if (!disabled) {
      onLevelUpdate(level);
    }
  };

  return (
    <Card className="tech-card border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm sm:text-base">Technology Readiness Level (TRL)</CardTitle>
          <Badge variant="secondary" className="text-xs">
            Level {currentLevel}/10
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 sm:px-6">
        {/* Desktop view - Horizontal */}
        <div className="hidden md:block">
          <div className="flex items-center gap-2 mb-4">
            {trlLevels.map((trl) => {
              const isCompleted = trl.level <= currentLevel;
              const isHovered = hoveredLevel === trl.level;
              
              return (
                <TooltipProvider key={trl.level}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleLevelClick(trl.level)}
                        onMouseEnter={() => setHoveredLevel(trl.level)}
                        onMouseLeave={() => setHoveredLevel(null)}
                        disabled={disabled}
                        className={`flex-1 h-12 rounded-lg border-2 transition-all ${
                          isCompleted
                            ? 'bg-primary border-primary text-primary-foreground'
                            : isHovered
                            ? 'bg-primary/10 border-primary/50'
                            : 'bg-muted border-muted-foreground/20 hover:border-primary/30'
                        } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                      >
                        <div className="flex flex-col items-center justify-center h-full">
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4 mb-1" />
                          ) : (
                            <Circle className="w-4 h-4 mb-1" />
                          )}
                          <span className="text-xs font-semibold">{trl.level}</span>
                        </div>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold text-sm mb-1">{trl.title}</p>
                      <p className="text-xs text-muted-foreground">{trl.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>

        {/* Mobile view - Scrollable horizontal */}
        <div className="md:hidden overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max mb-4">
            {trlLevels.map((trl) => {
              const isCompleted = trl.level <= currentLevel;
              
              return (
                <button
                  key={trl.level}
                  onClick={() => handleLevelClick(trl.level)}
                  disabled={disabled}
                  className={`w-16 h-16 rounded-lg border-2 transition-all flex-shrink-0 ${
                    isCompleted
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-muted border-muted-foreground/20'
                  } ${disabled ? 'cursor-not-allowed opacity-60' : 'active:scale-95'}`}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 mb-1" />
                    ) : (
                      <Circle className="w-5 h-5 mb-1" />
                    )}
                    <span className="text-xs font-semibold">{trl.level}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Current level description */}
        {currentLevel > 0 && (
          <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
            <p className="text-xs sm:text-sm font-medium text-foreground mb-1">
              {trlLevels[currentLevel - 1].title}
            </p>
            <p className="text-xs text-muted-foreground">
              {trlLevels[currentLevel - 1].description}
            </p>
          </div>
        )}

        {!disabled && currentLevel === 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Click on a level to mark your current technology readiness
          </p>
        )}
      </CardContent>
    </Card>
  );
}
