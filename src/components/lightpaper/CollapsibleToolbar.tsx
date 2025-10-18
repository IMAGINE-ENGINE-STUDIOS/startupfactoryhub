import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CollapsibleToolbarProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
}

export default function CollapsibleToolbar({
  title,
  children,
  defaultExpanded = true,
  className,
}: CollapsibleToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={cn("border-b bg-background shadow-sm", className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between px-4 h-12 w-full hover:bg-accent/50 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-1 w-8 rounded-full transition-all",
            isExpanded ? "bg-primary" : "bg-muted-foreground"
          )} />
          <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            {title}
          </span>
          {!isExpanded && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              Click to expand tools
            </span>
          )}
        </div>
        <div className={cn(
          "flex items-center gap-2 text-sm text-muted-foreground transition-transform",
          isExpanded && "rotate-180"
        )}>
          <ChevronDown className="h-5 w-5" />
        </div>
      </button>
      
      {isExpanded && (
        <div className="p-4 border-t bg-muted/30 animate-accordion-down">
          {children}
        </div>
      )}
    </div>
  );
}
