import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface Collaborator {
  id: string;
  user_name: string;
  user_color: string;
  position: { x: number; y: number };
  page_number: number;
  last_active: string;
}

interface CollaborationCursorsProps {
  collaborators: Collaborator[];
  currentPage: number;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const CollaborationCursors = ({
  collaborators,
  currentPage,
  containerRef,
}: CollaborationCursorsProps) => {
  const [activeCollaborators, setActiveCollaborators] = useState<Collaborator[]>([]);

  useEffect(() => {
    // Filter collaborators on the current page and still active (last 10 seconds)
    const now = Date.now();
    const active = collaborators.filter((collab) => {
      const lastActive = new Date(collab.last_active).getTime();
      const isRecent = now - lastActive < 10000; // 10 seconds
      return collab.page_number === currentPage && isRecent;
    });
    setActiveCollaborators(active);
  }, [collaborators, currentPage]);

  if (activeCollaborators.length === 0) return null;

  return (
    <>
      {/* Active users panel */}
      <Card className="absolute top-4 right-4 p-3 z-10 bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {activeCollaborators.length} {activeCollaborators.length === 1 ? 'user' : 'users'} editing
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          {activeCollaborators.map((collab) => (
            <div key={collab.id} className="relative group">
              <Avatar
                className="w-8 h-8"
                style={{ 
                  border: `2px solid ${collab.user_color}`,
                }}
              >
                <AvatarFallback
                  className="text-xs font-bold"
                  style={{
                    backgroundColor: collab.user_color + '20',
                    color: collab.user_color,
                  }}
                >
                  {collab.user_name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {collab.user_name}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Cursor overlays */}
      {activeCollaborators.map((collab) => (
        <div
          key={collab.id}
          className="absolute pointer-events-none z-20 transition-all duration-100"
          style={{
            left: `${collab.position.x}px`,
            top: `${collab.position.y}px`,
          }}
        >
          {/* Cursor pointer */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 3L19 12L12 13L9 21L5 3Z"
              fill={collab.user_color}
              stroke="white"
              strokeWidth="2"
            />
          </svg>
          {/* User name label */}
          <div
            className="ml-6 -mt-4 px-2 py-1 rounded text-xs font-medium text-white shadow-lg"
            style={{ backgroundColor: collab.user_color }}
          >
            {collab.user_name}
          </div>
        </div>
      ))}
    </>
  );
};
