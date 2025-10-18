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
  defaultExpanded = false,
  className,
}: CollapsibleToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={cn("border-b bg-background/95 backdrop-blur", className)}>
      <div className="flex items-center justify-between px-4 h-10">
        <span className="text-sm font-medium">{title}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-7 w-7 p-0"
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="p-2 border-t animate-accordion-down">
          {children}
        </div>
      )}
    </div>
  );
}
