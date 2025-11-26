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
      <div 
        className="p-1.5 bg-muted/30 overflow-x-auto"
        style={{
          scrollbarWidth: 'auto',
          scrollbarColor: 'hsl(var(--muted-foreground)) transparent',
          scrollBehavior: 'smooth'
        }}
      >
        <style dangerouslySetInnerHTML={{
          __html: `
            .p-1\\.5::-webkit-scrollbar {
              height: 12px;
            }
            .p-1\\.5::-webkit-scrollbar-thumb {
              background: hsl(var(--muted-foreground));
              border-radius: 6px;
            }
            .p-1\\.5::-webkit-scrollbar-thumb:hover {
              background: hsl(var(--foreground) / 0.6);
            }
            .p-1\\.5::-webkit-scrollbar-track {
              background: transparent;
            }
          `
        }} />
        {children}
      </div>
    </div>
  );
}
