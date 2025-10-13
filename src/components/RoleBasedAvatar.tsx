import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import startupBadge from '@/assets/startup-badge.png';
import advisorBadge from '@/assets/advisor-badge.png';
import investorBadge from '@/assets/investor-badge.png';
import studentBadge from '@/assets/student-badge.png';
import mentorBadge from '@/assets/mentor-badge.png';

interface RoleBasedAvatarProps {
  avatarUrl?: string | null;
  role?: 'startup' | 'advisor' | 'investor' | 'student' | 'mentor' | null;
  fallbackText?: string;
  className?: string;
}

export default function RoleBasedAvatar({ 
  avatarUrl, 
  role, 
  fallbackText = 'U',
  className 
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
      default:
        return undefined;
    }
  };

  const defaultBadge = getDefaultBadge();

  return (
    <Avatar className={className}>
      <AvatarImage src={defaultBadge || undefined} />
      <AvatarFallback className="bg-gradient-primary text-primary-foreground">
        {fallbackText.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
