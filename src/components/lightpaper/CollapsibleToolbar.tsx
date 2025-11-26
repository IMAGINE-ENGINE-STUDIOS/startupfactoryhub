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
      <div className="p-1.5 bg-muted/30 overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {children}
      </div>
    </div>
  );
}
