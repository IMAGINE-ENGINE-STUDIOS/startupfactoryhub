import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import startupBadge from '@/assets/startup-badge.png';
import advisorBadge from '@/assets/advisor-badge.png';
import investorBadge from '@/assets/investor-badge.png';
import studentBadge from '@/assets/student-badge.png';
import mentorBadge from '@/assets/mentor-badge.png';
import acceleratorBadge from '@/assets/sfh-logo-sphere.png';
import { OnlineStatusIndicator } from './OnlineStatusIndicator';

interface RoleBasedAvatarProps {
  avatarUrl?: string | null;
  role?: 'startup' | 'advisor' | 'investor' | 'student' | 'mentor' | 'accelerator' | 'admin' | null;
  fallbackText?: string;
  className?: string;
  userId?: string;
  showOnlineStatus?: boolean;
}

export default function RoleBasedAvatar({ 
  avatarUrl, 
  role, 
  fallbackText = 'U',
  className,
  userId,
  showOnlineStatus = false
}: RoleBasedAvatarProps) {
  // Determine the default badge based on role
  const getDefaultBadge = () => {
    if (avatarUrl) return avatarUrl;
    
    switch (role) {
      case 'startup':
        return startupBadge;
      case 'advisor':
        return advisorBadge;
      case 'mentor':
        return mentorBadge;
      case 'investor':
        return investorBadge;
      case 'student':
        return studentBadge;
      case 'accelerator':
        return acceleratorBadge;
      default:
        return undefined;
    }
  };

  const defaultBadge = getDefaultBadge();

  return (
    <div className="relative inline-block">
      <Avatar className={className}>
        <AvatarImage src={defaultBadge || undefined} />
        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
          {fallbackText.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      {showOnlineStatus && userId && (
        <OnlineStatusIndicator 
          userId={userId} 
          size="md" 
          className="absolute bottom-0 right-0 ring-2 ring-background"
        />
      )}
    </div>
  );
}
