import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, Share2, Printer, Plus, X, Pen } from "lucide-react";
import { cn } from "@/lib/utils";
interface FloatingActionMenuProps {
  onSave?: () => void;
  onShare?: () => void;
  onPrint?: () => void;
  onSignature?: () => void;
  position?: "left" | "right";
}
export default function FloatingActionMenu({
  onSave,
  onShare,
  onPrint,
  onSignature,
  position = "right"
}: FloatingActionMenuProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const actions = [{
    icon: Pen,
    label: "Signature",
    onClick: onSignature,
    show: !!onSignature
  }].filter(action => action.show);
  return <div className={cn("fixed bottom-[88px] sm:bottom-24 z-50 flex flex-col gap-2", position === "right" ? "right-4 sm:right-6" : "left-4 sm:left-6")}>
      {isExpanded && actions.map((action, index) => <Button key={index} onClick={() => {
      action.onClick?.();
      setIsExpanded(false);
    }} size="icon" className="h-12 w-12 rounded-full shadow-lg animate-scale-in" style={{
      animationDelay: `${index * 50}ms`
    }} title={action.label}>
            <action.icon className="h-5 w-5" />
          </Button>)}

      
    </div>;
}