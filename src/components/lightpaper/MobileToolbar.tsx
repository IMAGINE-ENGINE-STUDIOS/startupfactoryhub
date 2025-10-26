import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MoreHorizontal } from "lucide-react";
import { LucideIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ToolbarAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: "default" | "ghost" | "outline";
  disabled?: boolean;
  priority?: "high" | "medium" | "low";
}

interface ToolbarGroup {
  label: string;
  actions: ToolbarAction[];
}

interface MobileToolbarProps {
  groups: ToolbarGroup[];
  rightActions?: ToolbarAction[];
}

export function MobileToolbar({ groups, rightActions = [] }: MobileToolbarProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    // Desktop view - show all actions
    return (
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-0.5 flex-wrap">
          {groups.map((group, groupIdx) => (
            <div key={groupIdx} className="flex items-center gap-0.5">
              {groupIdx > 0 && <div className="w-px h-6 bg-border mx-1" />}
              {group.actions.map((action, actionIdx) => (
                <Button
                  key={actionIdx}
                  variant={action.variant || "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  title={action.label}
                >
                  <action.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
          ))}
        </div>
        {rightActions.length > 0 && (
          <div className="flex items-center gap-0.5">
            {rightActions.map((action, idx) => (
              <Button
                key={idx}
                variant={action.variant || "ghost"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={action.onClick}
                disabled={action.disabled}
                title={action.label}
              >
                <action.icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Mobile view - show all actions in horizontal scrollable container
  return (
    <div className="flex items-center gap-2 w-full overflow-hidden">
      <div className="flex-1 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-0.5 pb-1">
          {groups.map((group, groupIdx) => (
            <div key={groupIdx} className="flex items-center gap-0.5">
              {groupIdx > 0 && <div className="w-px h-6 bg-border mx-1" />}
              {group.actions.map((action, actionIdx) => (
                <Button
                  key={actionIdx}
                  variant={action.variant || "ghost"}
                  size="sm"
                  className="h-8 w-8 p-0 flex-shrink-0"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  title={action.label}
                >
                  <action.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
          ))}
        </div>
      </div>
      {rightActions.length > 0 && (
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {rightActions.map((action, idx) => (
            <Button
              key={idx}
              variant={action.variant || "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={action.onClick}
              disabled={action.disabled}
              title={action.label}
            >
              <action.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
