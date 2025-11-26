import { cn } from "@/lib/utils";

interface CollapsibleToolbarProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function CollapsibleToolbar({
  children,
  className,
}: CollapsibleToolbarProps) {
  return (
    <div className={cn("border-b bg-background shadow-sm overflow-hidden", className)}>
      <style dangerouslySetInnerHTML={{
        __html: `
          .toolbar-scrollable::-webkit-scrollbar {
            height: 14px;
          }
          .toolbar-scrollable::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 7px;
            cursor: grab;
          }
          .toolbar-scrollable::-webkit-scrollbar-thumb:active {
            cursor: grabbing;
            background: #555;
          }
          .toolbar-scrollable::-webkit-scrollbar-thumb:hover {
            background: #666;
          }
          .toolbar-scrollable::-webkit-scrollbar-track {
            background: rgba(0,0,0,0.1);
            border-radius: 7px;
            margin: 0 8px;
          }
        `
      }} />
      <div 
        className="p-1.5 bg-muted/30 overflow-x-auto toolbar-scrollable"
        style={{
          scrollbarWidth: 'auto',
          scrollbarColor: '#888 rgba(0,0,0,0.1)',
          scrollBehavior: 'smooth',
          cursor: 'grab'
        }}
      >
        {children}
      </div>
    </div>
  );
}
