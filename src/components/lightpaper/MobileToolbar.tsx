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

  // Mobile view - show priority actions + dropdown
  const highPriorityActions = groups.flatMap(g => 
    g.actions.filter(a => a.priority === "high")
  );
  const otherActions = groups.flatMap(g => 
    g.actions.filter(a => a.priority !== "high")
  );

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1">
        {highPriorityActions.slice(0, 3).map((action, idx) => (
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

      <div className="flex items-center gap-1">
        {rightActions.slice(0, 2).map((action, idx) => (
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

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px]">
            <SheetHeader>
              <SheetTitle>Tools</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
              <div className="space-y-1">
                {groups.map((group, groupIdx) => (
                  <div key={groupIdx} className="space-y-1">
                    {groupIdx > 0 && <DropdownMenuSeparator className="my-2" />}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {group.label}
                    </div>
                    {group.actions.map((action, actionIdx) => (
                      <Button
                        key={actionIdx}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 h-9"
                        onClick={action.onClick}
                        disabled={action.disabled}
                      >
                        <action.icon className="h-4 w-4" />
                        {action.label}
                      </Button>
                    ))}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
