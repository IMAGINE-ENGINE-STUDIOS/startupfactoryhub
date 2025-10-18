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
    <div className={cn("border-b bg-background shadow-sm", className)}>
      <div className="p-2 bg-muted/30">
        {children}
      </div>
    </div>
  );
}
