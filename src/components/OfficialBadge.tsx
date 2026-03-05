import { Star, Shield } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface OfficialBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
  role?: string;
}

export default function OfficialBadge({ size = 'sm', className = '', showLabel = false, role }: OfficialBadgeProps) {
  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const label = role === 'advisor' ? 'Official Advisor' : 'Official Mentor';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`inline-flex items-center gap-1 ${className}`}>
          <span className="relative inline-flex">
            <Shield className={`${sizeClasses[size]} text-amber-400 fill-amber-400/20`} />
            <Star className={`absolute inset-0 m-auto h-[55%] w-[55%] text-amber-300 fill-amber-300`} />
          </span>
          {showLabel && (
            <span className="text-xs font-semibold text-amber-400">{label}</span>
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs font-medium">{label} — Verified Partner</p>
      </TooltipContent>
    </Tooltip>
  );
}
