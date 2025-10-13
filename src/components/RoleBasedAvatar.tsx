import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import startupBadge from '@/assets/startup-badge.png';
import advisorBadge from '@/assets/advisor-badge.png';

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
      case 'mentor':
        return advisorBadge;
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
