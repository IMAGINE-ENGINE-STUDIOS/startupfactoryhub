import { Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CollaboratorPresence } from '@/hooks/useCollaboration';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ActiveUsersListProps {
  users: CollaboratorPresence[];
  currentUserColor: string;
}

export const ActiveUsersList = ({ users, currentUserColor }: ActiveUsersListProps) => {
  const totalUsers = users.length + 1; // +1 for current user

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Users className="w-4 h-4 mr-2" />
          <span className="hidden md:inline">Active</span>
          <Badge 
            variant="secondary" 
            className="ml-2 h-5 min-w-5 flex items-center justify-center p-0 px-1.5"
          >
            {totalUsers}
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Active Users</h4>
            <Badge variant="secondary">{totalUsers} online</Badge>
          </div>

          <div className="space-y-2">
            {/* Current user */}
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
              <Avatar className="w-8 h-8 border-2" style={{ borderColor: currentUserColor }}>
                <AvatarFallback 
                  className="text-xs font-medium"
                  style={{ backgroundColor: currentUserColor + '20', color: currentUserColor }}
                >
                  You
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">You</p>
                  <div 
                    className="w-2 h-2 rounded-full animate-pulse" 
                    style={{ backgroundColor: currentUserColor }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">Editing now</p>
              </div>
            </div>

            {/* Other users */}
            {users.length === 0 ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No other users online
              </div>
            ) : (
              users.map((user) => (
                <div 
                  key={user.userId} 
                  className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <Avatar className="w-8 h-8 border-2" style={{ borderColor: user.color }}>
                    <AvatarFallback 
                      className="text-xs font-medium"
                      style={{ backgroundColor: user.color + '20', color: user.color }}
                    >
                      {user.userName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{user.userName}</p>
                      <div 
                        className="w-2 h-2 rounded-full animate-pulse" 
                        style={{ backgroundColor: user.color }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{user.userEmail}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
